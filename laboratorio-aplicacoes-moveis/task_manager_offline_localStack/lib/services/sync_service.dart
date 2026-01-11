import 'dart:async';
import '../models/task.dart';
import '../models/sync_operation.dart';
import 'database_service.dart';
import 'api_service.dart';
import 'connectivity_service.dart';

class SyncService {
  final DatabaseService _db = DatabaseService.instance;
  final ApiService _api;
  final ConnectivityService _connectivity = ConnectivityService.instance;
  
  bool _isSyncing = false;
  Timer? _autoSyncTimer;
  
  final _syncStatusController = StreamController<SyncEvent>.broadcast();
  Stream<SyncEvent> get syncStatusStream => _syncStatusController.stream;

  SyncService({String userId = 'user1'}) : _api = ApiService(userId: userId);

  Future<SyncResult> sync() async {
    if (_isSyncing) {
      print('⏳ Sincronização já em andamento');
      return SyncResult(
        success: false,
        message: 'Sincronização já em andamento',
      );
    }

    if (!_connectivity.isOnline) {
      print('📴 Sem conectividade - operações enfileiradas');
      return SyncResult(
        success: false,
        message: 'Sem conexão com internet',
      );
    }

    _isSyncing = true;
    _notifyStatus(SyncEvent.syncStarted());

    try {
      print('🔄 Iniciando sincronização...');
      
      final pushResult = await _pushPendingOperations();
      final pullResult = await _pullFromServer();
      
      await _db.setMetadata(
        'lastSyncTimestamp',
        DateTime.now().millisecondsSinceEpoch.toString(),
      );
      
      print('✅ Sincronização concluída');
      _notifyStatus(SyncEvent.syncCompleted(
        pushedCount: pushResult,
        pulledCount: pullResult,
      ));
      
      return SyncResult(
        success: true,
        message: 'Sincronização concluída com sucesso',
        pushedOperations: pushResult,
        pulledTasks: pullResult,
      );
      
    } catch (e) {
      print('❌ Erro na sincronização: $e');
      _notifyStatus(SyncEvent.syncError(e.toString()));
      
      return SyncResult(
        success: false,
        message: 'Erro na sincronização: $e',
      );
    } finally {
      _isSyncing = false;
    }
  }

  Future<int> _pushPendingOperations() async {
    final operations = await _db.getPendingSyncOperations();
    print('📤 Enviando ${operations.length} operações pendentes');
    
    int successCount = 0;

    for (final operation in operations) {
      try {
        await _processOperation(operation);
        await _db.removeSyncOperation(operation.id);
        successCount++;
      } catch (e) {
        print('❌ Erro ao processar operação ${operation.id}: $e');
        
        await _db.updateSyncOperation(
          operation.copyWith(
            retries: operation.retries + 1,
            error: e.toString(),
          ),
        );
        
        if (operation.retries >= 3) {
          await _db.updateSyncOperation(
            operation.copyWith(status: SyncOperationStatus.failed),
          );
        }
      }
    }

    return successCount;
  }

  Future<void> _processOperation(SyncOperation operation) async {
    switch (operation.type) {
      case OperationType.create:
        await _pushCreate(operation);
        break;
      case OperationType.update:
        await _pushUpdate(operation);
        break;
      case OperationType.delete:
        await _pushDelete(operation);
        break;
    }
  }

  Future<void> _pushCreate(SyncOperation operation) async {
    final task = await _db.getTask(operation.taskId);
    if (task == null) return;

    final serverTask = await _api.createTask(task, imagePath: task.imagePath);
    
    await _db.upsertTask(
      task.copyWith(
        version: serverTask.version,
        updatedAt: serverTask.updatedAt,
        syncStatus: SyncStatus.synced,
        imagePath: serverTask.imagePath ?? task.imagePath,
      ),
    );
  }

  Future<void> _pushUpdate(SyncOperation operation) async {
    final task = await _db.getTask(operation.taskId);
    if (task == null) return;

    final result = await _api.updateTask(task, imagePath: task.imagePath);
    
    if (result['conflict'] == true) {
      final serverTask = result['serverTask'] as Task;
      await _resolveConflict(task, serverTask);
    } else {
      final updatedTask = result['task'] as Task;
      await _db.upsertTask(
        task.copyWith(
          version: updatedTask.version,
          updatedAt: updatedTask.updatedAt,
          syncStatus: SyncStatus.synced,
          imagePath: updatedTask.imagePath ?? task.imagePath,
        ),
      );
    }
  }

  Future<void> _pushDelete(SyncOperation operation) async {
    final task = await _db.getTask(operation.taskId);
    final version = task?.version ?? 1;

    await _api.deleteTask(operation.taskId, version);
    await _db.deleteTask(operation.taskId);
  }

  Future<int> _pullFromServer() async {
    final lastSyncStr = await _db.getMetadata('lastSyncTimestamp');
    final lastSync = lastSyncStr != null ? int.parse(lastSyncStr) : null;
    
    final result = await _api.getTasks(modifiedSince: lastSync);
    final serverTasks = result['tasks'] as List<Task>;
    
    print('📥 Recebidas ${serverTasks.length} tarefas do servidor');

    for (final serverTask in serverTasks) {
      final localTask = await _db.getTask(serverTask.id);
      
      if (localTask == null) {
        await _db.upsertTask(
          serverTask.copyWith(syncStatus: SyncStatus.synced),
        );
      } else if (localTask.syncStatus == SyncStatus.synced) {
        await _db.upsertTask(
          serverTask.copyWith(syncStatus: SyncStatus.synced),
        );
      } else {
        await _resolveConflict(localTask, serverTask);
      }
    }

    return serverTasks.length;
  }

  Future<void> _resolveConflict(Task localTask, Task serverTask) async {
    print('⚠️ Conflito detectado: ${localTask.id}');
    
    final localTime = localTask.localUpdatedAt ?? localTask.updatedAt;
    final serverTime = serverTask.updatedAt;

    Task winningTask;
    String reason;

    if (localTime.isAfter(serverTime)) {
      winningTask = localTask;
      reason = 'Modificação local é mais recente';
      print('🏆 LWW: Versão local vence');
      await _api.updateTask(localTask, imagePath: localTask.imagePath);
    } else {
      winningTask = serverTask;
      reason = 'Modificação do servidor é mais recente';
      print('🏆 LWW: Versão servidor vence');
    }

    await _db.upsertTask(
      winningTask.copyWith(syncStatus: SyncStatus.synced),
    );

    _notifyStatus(SyncEvent.conflictResolved(
      taskId: localTask.id,
      resolution: reason,
    ));
  }

  Future<Task> createTask(Task task) async {
    final savedTask = await _db.upsertTask(
      task.copyWith(
        syncStatus: SyncStatus.pending,
        localUpdatedAt: DateTime.now(),
      ),
    );

    await _db.addToSyncQueue(
      SyncOperation(
        type: OperationType.create,
        taskId: savedTask.id,
        data: savedTask.toMap(),
      ),
    );

    if (_connectivity.isOnline) {
      sync();
    }

    return savedTask;
  }

  Future<Task> updateTask(Task task) async {
    final updatedTask = await _db.upsertTask(
      task.copyWith(
        syncStatus: SyncStatus.pending,
        localUpdatedAt: DateTime.now(),
      ),
    );

    await _db.addToSyncQueue(
      SyncOperation(
        type: OperationType.update,
        taskId: updatedTask.id,
        data: updatedTask.toMap(),
      ),
    );

    if (_connectivity.isOnline) {
      sync();
    }

    return updatedTask;
  }

  Future<void> deleteTask(String taskId) async {
    final task = await _db.getTask(taskId);
    if (task == null) return;

    await _db.addToSyncQueue(
      SyncOperation(
        type: OperationType.delete,
        taskId: taskId,
        data: {'version': task.version},
      ),
    );

    await _db.deleteTask(taskId);

    if (_connectivity.isOnline) {
      sync();
    }
  }

  void startAutoSync({Duration interval = const Duration(seconds: 30)}) {
    stopAutoSync();

    _autoSyncTimer = Timer.periodic(interval, (timer) {
      if (_connectivity.isOnline && !_isSyncing) {
        print('🔄 Auto-sync iniciado');
        sync();
      }
    });

    print('✅ Auto-sync configurado (intervalo: ${interval.inSeconds}s)');
  }

  void stopAutoSync() {
    _autoSyncTimer?.cancel();
    _autoSyncTimer = null;
  }

  void _notifyStatus(SyncEvent event) {
    _syncStatusController.add(event);
  }

  Future<SyncStats> getStats() async {
    final dbStats = await _db.getStats();
    final lastSyncStr = await _db.getMetadata('lastSyncTimestamp');
    final lastSync = lastSyncStr != null
        ? DateTime.fromMillisecondsSinceEpoch(int.parse(lastSyncStr))
        : null;

    return SyncStats(
      totalTasks: dbStats['totalTasks'],
      unsyncedTasks: dbStats['unsyncedTasks'],
      queuedOperations: dbStats['queuedOperations'],
      lastSync: lastSync,
      isOnline: _connectivity.isOnline,
      isSyncing: _isSyncing,
    );
  }

  void dispose() {
    stopAutoSync();
    _syncStatusController.close();
  }
}

class SyncResult {
  final bool success;
  final String message;
  final int? pushedOperations;
  final int? pulledTasks;

  SyncResult({
    required this.success,
    required this.message,
    this.pushedOperations,
    this.pulledTasks,
  });
}

class SyncEvent {
  final SyncEventType type;
  final String? message;
  final Map<String, dynamic>? data;

  SyncEvent({
    required this.type,
    this.message,
    this.data,
  });

  factory SyncEvent.syncStarted() => SyncEvent(type: SyncEventType.started);
  
  factory SyncEvent.syncCompleted({int? pushedCount, int? pulledCount}) =>
      SyncEvent(
        type: SyncEventType.completed,
        data: {'pushed': pushedCount, 'pulled': pulledCount},
      );
  
  factory SyncEvent.syncError(String error) => SyncEvent(
        type: SyncEventType.error,
        message: error,
      );
  
  factory SyncEvent.conflictResolved({
    required String taskId,
    required String resolution,
  }) =>
      SyncEvent(
        type: SyncEventType.conflictResolved,
        message: resolution,
        data: {'taskId': taskId},
      );
}

enum SyncEventType {
  started,
  completed,
  error,
  conflictResolved,
}

class SyncStats {
  final int totalTasks;
  final int unsyncedTasks;
  final int queuedOperations;
  final DateTime? lastSync;
  final bool isOnline;
  final bool isSyncing;

  SyncStats({
    required this.totalTasks,
    required this.unsyncedTasks,
    required this.queuedOperations,
    this.lastSync,
    required this.isOnline,
    required this.isSyncing,
  });
}
