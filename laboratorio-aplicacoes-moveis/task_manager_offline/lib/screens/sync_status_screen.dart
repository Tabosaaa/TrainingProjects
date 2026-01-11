import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/task_provider.dart';
import '../services/sync_service.dart';
import '../services/connectivity_service.dart';

class SyncStatusScreen extends StatefulWidget {
  const SyncStatusScreen({super.key});

  @override
  State<SyncStatusScreen> createState() => _SyncStatusScreenState();
}

class _SyncStatusScreenState extends State<SyncStatusScreen> {
  final _connectivity = ConnectivityService.instance;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Status de Sincronização'),
      ),
      body: Consumer<TaskProvider>(
        builder: (context, provider, child) {
          return FutureBuilder<SyncStats>(
            future: provider.getSyncStats(),
            builder: (context, snapshot) {
              if (!snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }

              final stats = snapshot.data!;
              final hasNetwork = _connectivity.hasNetwork;
              final serverReachable = _connectivity.isServerReachable;

              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Seção de Conectividade
                  _buildSectionTitle('Conectividade'),
                  _buildStatusCard(
                    title: 'Rede do Dispositivo',
                    icon: Icons.wifi,
                    value: hasNetwork ? 'Disponível' : 'Indisponível',
                    color: hasNetwork ? Colors.green : Colors.red,
                    subtitle: hasNetwork ? 'WiFi ou dados móveis' : 'Ative WiFi ou dados',
                  ),
                  _buildStatusCard(
                    title: 'Servidor API',
                    icon: Icons.dns,
                    value: serverReachable ? 'Acessível' : 'Inacessível',
                    color: serverReachable ? Colors.green : Colors.red,
                    subtitle: serverReachable 
                        ? 'localhost:3000 respondendo' 
                        : hasNetwork 
                            ? 'Verifique se npm start foi executado'
                            : 'Sem rede para verificar',
                  ),
                  _buildStatusCard(
                    title: 'Status Final',
                    icon: Icons.cloud,
                    value: stats.isOnline ? 'Online' : 'Offline',
                    color: stats.isOnline ? Colors.green : Colors.orange,
                    subtitle: stats.isOnline 
                        ? 'Pronto para sincronizar'
                        : 'Operações serão enfileiradas',
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Seção de Sincronização
                  _buildSectionTitle('Sincronização'),
                  _buildStatusCard(
                    title: 'Status de Sync',
                    icon: Icons.sync,
                    value: stats.isSyncing ? 'Sincronizando...' : 'Ocioso',
                    color: stats.isSyncing ? Colors.blue : Colors.grey,
                  ),
                  _buildStatusCard(
                    title: 'Última Sincronização',
                    icon: Icons.update,
                    value: stats.lastSync != null
                        ? DateFormat('dd/MM/yyyy HH:mm').format(stats.lastSync!)
                        : 'Nunca',
                    color: Colors.grey,
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Seção de Dados
                  _buildSectionTitle('Dados'),
                  _buildStatusCard(
                    title: 'Total de Tarefas',
                    icon: Icons.task,
                    value: '${stats.totalTasks}',
                    color: Colors.blue,
                  ),
                  _buildStatusCard(
                    title: 'Tarefas Não Sincronizadas',
                    icon: Icons.cloud_off,
                    value: '${stats.unsyncedTasks}',
                    color: stats.unsyncedTasks > 0 ? Colors.orange : Colors.green,
                    subtitle: stats.unsyncedTasks > 0 
                        ? 'Aguardando conexão'
                        : 'Tudo sincronizado',
                  ),
                  _buildStatusCard(
                    title: 'Operações na Fila',
                    icon: Icons.queue,
                    value: '${stats.queuedOperations}',
                    color: stats.queuedOperations > 0 ? Colors.orange : Colors.green,
                    subtitle: 'CREATE/UPDATE/DELETE pendentes',
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Botões de ação
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                    onPressed: stats.isOnline && !stats.isSyncing
                        ? () => _handleSync(context, provider)
                        : null,
                    icon: const Icon(Icons.sync),
                          label: const Text('Sincronizar'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _checkServer(),
                          icon: const Icon(Icons.refresh),
                          label: const Text('Verificar Servidor'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.bold,
          color: Colors.grey.shade600,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildStatusCard({
    required String title,
    required IconData icon,
    required String value,
    required Color color,
    String? subtitle,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleSync(BuildContext context, TaskProvider provider) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🔄 Iniciando sincronização...'),
        duration: Duration(seconds: 1),
      ),
    );

    final result = await provider.sync();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result.success
                ? '✅ Sincronização concluída'
                : '❌ ${result.message}',
          ),
          backgroundColor: result.success ? Colors.green : Colors.red,
        ),
      );
      setState(() {}); // Refresh the stats
  }
}

  Future<void> _checkServer() async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🔍 Verificando servidor...'),
        duration: Duration(seconds: 1),
      ),
    );
    
    final reachable = await _connectivity.checkServerNow();
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            reachable 
                ? '✅ Servidor está acessível!'
                : '❌ Servidor não responde',
          ),
          backgroundColor: reachable ? Colors.green : Colors.red,
        ),
      );
      setState(() {}); // Refresh the UI
    }
  }
}
