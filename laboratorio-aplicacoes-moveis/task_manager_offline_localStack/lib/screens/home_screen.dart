import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/task_provider.dart';
import '../models/task.dart';
import '../services/connectivity_service.dart';
import 'task_form_screen.dart';
import 'sync_status_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  final _connectivity = ConnectivityService.instance;
  bool _isOnline = true;
  bool _hasNetwork = true;
  bool _serverReachable = true;
  bool _isSyncing = false;
  late AnimationController _syncAnimationController;

  @override
  void initState() {
    super.initState();
    _syncAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    );
    _initializeConnectivity();
  }

  @override
  void dispose() {
    _syncAnimationController.dispose();
    super.dispose();
  }

  Future<void> _initializeConnectivity() async {
    await _connectivity.initialize();
    _updateConnectivityState();
    
    _connectivity.connectivityStream.listen((isOnline) {
      _updateConnectivityState();
      
      if (isOnline) {
        _showSnackBar('🟢 Conectado - Sincronizando...', Colors.green);
        _handleAutoSync();
      } else if (_connectivity.hasNetwork && !_connectivity.isServerReachable) {
        _showSnackBar('🟡 Servidor inacessível - Verifique se está rodando', Colors.orange);
      } else {
        _showSnackBar('🔴 Modo Offline - Alterações serão salvas localmente', Colors.orange);
      }
    });
  }
  
  void _updateConnectivityState() {
    setState(() {
      _isOnline = _connectivity.isOnline;
      _hasNetwork = _connectivity.hasNetwork;
      _serverReachable = _connectivity.isServerReachable;
    });
  }

  Future<void> _handleAutoSync() async {
    if (!mounted) return;
    setState(() => _isSyncing = true);
    _syncAnimationController.repeat();
    
    await context.read<TaskProvider>().sync();
    
    if (mounted) {
      setState(() => _isSyncing = false);
      _syncAnimationController.stop();
      _syncAnimationController.reset();
    }
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tarefas Offline-First'),
        backgroundColor: _isOnline ? null : Colors.orange.shade100,
        actions: [
          _buildConnectivityIndicator(),
          RotationTransition(
            turns: Tween(begin: 0.0, end: 1.0).animate(_syncAnimationController),
            child: IconButton(
              icon: Icon(
                Icons.sync,
                color: _isSyncing ? Colors.blue : null,
              ),
              onPressed: _isOnline && !_isSyncing ? _handleManualSync : null,
              tooltip: _isSyncing ? 'Sincronizando...' : 'Sincronizar',
            ),
          ),
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () => _navigateToSyncStatus(),
            tooltip: 'Status de Sincronização',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildConnectivityBanner(),
          Expanded(
            child: Consumer<TaskProvider>(
              builder: (context, taskProvider, child) {
                if (taskProvider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (taskProvider.error != null) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 64, color: Colors.red),
                        const SizedBox(height: 16),
                        Text('Erro: ${taskProvider.error}'),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => taskProvider.loadTasks(),
                          child: const Text('Tentar Novamente'),
                        ),
                      ],
                    ),
                  );
                }

                final tasks = taskProvider.tasks;
                final unsyncedCount = taskProvider.unsyncedTasks.length;

                if (tasks.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.inbox_outlined,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Nenhuma tarefa',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _isOnline 
                              ? 'Toque em + para criar' 
                              : 'Toque em + para criar (modo offline)',
                          style: TextStyle(color: Colors.grey[500]),
                        ),
                      ],
                    ),
                  );
                }

                return Column(
                  children: [
                    if (unsyncedCount > 0)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                        color: Colors.amber.shade100,
                        child: Row(
                          children: [
                            const Icon(Icons.cloud_off, size: 18, color: Colors.orange),
                            const SizedBox(width: 8),
                            Text(
                              '$unsyncedCount tarefa(s) pendente(s) de sincronização',
                              style: TextStyle(
                                color: Colors.orange.shade800,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: () => taskProvider.sync(),
                        child: ListView.builder(
                          itemCount: tasks.length,
                          padding: const EdgeInsets.all(8),
                          itemBuilder: (context, index) {
                            final task = tasks[index];
                            return _buildTaskCard(task, taskProvider);
                          },
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _navigateToTaskForm,
        tooltip: 'Nova Tarefa',
        backgroundColor: _isOnline ? null : Colors.orange,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildConnectivityBanner() {
    if (_isOnline) return const SizedBox.shrink();
    
    final bool hasNetworkNoServer = _hasNetwork && !_serverReachable;
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: hasNetworkNoServer 
              ? [Colors.orange.shade400, Colors.amber.shade400]
              : [Colors.red.shade400, Colors.orange.shade400],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            hasNetworkNoServer ? Icons.cloud_off : Icons.wifi_off, 
            color: Colors.white, 
            size: 20
          ),
          const SizedBox(width: 8),
          Text(
            hasNetworkNoServer ? 'SERVIDOR INACESSÍVEL' : 'MODO OFFLINE',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              hasNetworkNoServer 
                  ? 'Verifique se o servidor está rodando'
                  : 'Dados salvos localmente',
              style: const TextStyle(color: Colors.white, fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConnectivityIndicator() {
    Color bgColor;
    Color dotColor;
    String label;
    String tooltip;
    
    if (_isOnline) {
      bgColor = Colors.green.shade100;
      dotColor = Colors.green;
      label = 'Online';
      tooltip = 'Conectado ao servidor';
    } else if (_hasNetwork && !_serverReachable) {
      bgColor = Colors.orange.shade100;
      dotColor = Colors.orange;
      label = 'Servidor Off';
      tooltip = 'Rede OK, mas servidor não responde';
    } else {
      bgColor = Colors.red.shade100;
      dotColor = Colors.red;
      label = 'Offline';
      tooltip = 'Sem conexão de rede';
    }
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Tooltip(
        message: tooltip,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: dotColor,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: dotColor.withValues(alpha: 0.8),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTaskCard(Task task, TaskProvider provider) {
    final isPending = task.syncStatus == SyncStatus.pending;
    final hasError = task.syncStatus == SyncStatus.error;
    final hasConflict = task.syncStatus == SyncStatus.conflict;
    
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isPending 
            ? BorderSide(color: Colors.orange.shade300, width: 2)
            : hasError || hasConflict
                ? BorderSide(color: Colors.red.shade300, width: 2)
                : BorderSide.none,
      ),
      child: ListTile(
        leading: Stack(
          children: [
            Checkbox(
              value: task.completed,
              onChanged: (_) => provider.toggleCompleted(task),
            ),
            if (isPending || hasError || hasConflict)
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 2,
                      ),
                    ],
                  ),
                  child: Icon(
                    isPending ? Icons.cloud_off : Icons.error,
                    size: 14,
                    color: isPending ? Colors.orange : Colors.red,
                  ),
                ),
              ),
          ],
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                task.title,
                style: TextStyle(
                  decoration: task.completed ? TextDecoration.lineThrough : null,
                  color: task.completed ? Colors.grey : null,
                ),
              ),
            ),
            _buildSyncStatusIcon(task.syncStatus),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (task.description.isNotEmpty)
              Text(
                task.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: task.completed ? Colors.grey : null,
                ),
              ),
            const SizedBox(height: 4),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: [
                _buildPriorityBadge(task.priority),
                _buildSyncStatusBadge(task.syncStatus),
                if (task.imagePath != null && task.imagePath!.isNotEmpty)
                  _buildImageBadge(task.imagePath!),
              ],
            ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit, size: 20),
              onPressed: () => _navigateToTaskForm(task: task),
            ),
            IconButton(
              icon: const Icon(Icons.delete, size: 20),
              onPressed: () => _confirmDelete(task, provider),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSyncStatusIcon(SyncStatus status) {
    IconData icon;
    Color color;
    String tooltip;
    
    switch (status) {
      case SyncStatus.synced:
        icon = Icons.cloud_done;
        color = Colors.green;
        tooltip = 'Sincronizado';
        break;
      case SyncStatus.pending:
        icon = Icons.cloud_off;
        color = Colors.orange;
        tooltip = 'Pendente de sincronização';
        break;
      case SyncStatus.conflict:
        icon = Icons.cloud_sync;
        color = Colors.red;
        tooltip = 'Conflito detectado';
        break;
      case SyncStatus.error:
        icon = Icons.cloud_off;
        color = Colors.red;
        tooltip = 'Erro na sincronização';
        break;
    }
    
    return Tooltip(
      message: tooltip,
      child: Icon(icon, size: 18, color: color),
    );
  }

  Widget _buildPriorityBadge(String priority) {
    Color color;
    String label;
    switch (priority) {
      case 'urgent':
        color = Colors.red;
        label = 'URGENTE';
        break;
      case 'high':
        color = Colors.orange;
        label = 'ALTA';
        break;
      case 'medium':
        color = Colors.blue;
        label = 'MÉDIA';
        break;
      case 'low':
        color = Colors.green;
        label = 'BAIXA';
        break;
      default:
        color = Colors.grey;
        label = priority.toUpperCase();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  Widget _buildSyncStatusBadge(SyncStatus status) {
    Color color = _getSyncStatusColor(status);
    String label;
    IconData icon;
    
    switch (status) {
      case SyncStatus.synced:
        label = 'Sincronizado';
        icon = Icons.check;
        break;
      case SyncStatus.pending:
        label = 'Pendente';
        icon = Icons.schedule;
        break;
      case SyncStatus.conflict:
        label = 'Conflito';
        icon = Icons.warning;
        break;
      case SyncStatus.error:
        label = 'Erro';
        icon = Icons.error_outline;
        break;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Color _getSyncStatusColor(SyncStatus status) {
    switch (status) {
      case SyncStatus.synced:
        return Colors.green;
      case SyncStatus.pending:
        return Colors.orange;
      case SyncStatus.conflict:
        return Colors.red;
      case SyncStatus.error:
        return Colors.red;
    }
  }

  Widget _buildImageBadge(String imagePath) {
    final file = File(imagePath);
    final exists = file.existsSync();
    
    return GestureDetector(
      onTap: exists ? () => _showImageDialog(imagePath) : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: exists ? Colors.blue.withValues(alpha: 0.2) : Colors.grey.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              exists ? Icons.image : Icons.broken_image,
              size: 10,
              color: exists ? Colors.blue : Colors.grey,
            ),
            const SizedBox(width: 4),
            Text(
              exists ? 'Foto' : 'Sem foto',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                color: exists ? Colors.blue : Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showImageDialog(String imagePath) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppBar(
              title: const Text('Foto da Tarefa'),
              automaticallyImplyLeading: false,
              actions: [
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            Image.file(
              File(imagePath),
              fit: BoxFit.contain,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleManualSync() async {
    final provider = context.read<TaskProvider>();
    
    _showSnackBar('🔄 Sincronizando...', Colors.blue);
    
    final result = await provider.sync();
    
    if (result.success) {
      _showSnackBar('✅ Sincronização concluída', Colors.green);
    } else {
      _showSnackBar('❌ Erro na sincronização', Colors.red);
    }
  }

  void _navigateToTaskForm({Task? task}) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => TaskFormScreen(task: task),
      ),
    );
  }

  void _navigateToSyncStatus() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const SyncStatusScreen(),
      ),
    );
  }

  Future<void> _confirmDelete(Task task, TaskProvider provider) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar exclusão'),
        content: Text('Deseja deletar "${task.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Deletar'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await provider.deleteTask(task.id);
      if (mounted) {
        _showSnackBar('🗑️ Tarefa deletada', Colors.grey);
      }
    }
  }
}
