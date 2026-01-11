import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/task.dart';
import '../models/sync_operation.dart';

class DatabaseService {
  static final DatabaseService instance = DatabaseService._init();
  static Database? _database;

  DatabaseService._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('task_manager_offline.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 2,
      onCreate: _createDB,
      onUpgrade: _upgradeDB,
    );
  }

  Future<void> _upgradeDB(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('ALTER TABLE tasks ADD COLUMN imagePath TEXT');
      print('✅ Banco de dados atualizado para versão 2 (imagePath adicionado)');
    }
  }

  Future<void> _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed INTEGER NOT NULL DEFAULT 0,
        priority TEXT NOT NULL,
        userId TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        syncStatus TEXT NOT NULL,
        localUpdatedAt INTEGER,
        imagePath TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE sync_queue (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        taskId TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        retries INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        error TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    ''');

    await db.execute('CREATE INDEX idx_tasks_userId ON tasks(userId)');
    await db.execute('CREATE INDEX idx_tasks_syncStatus ON tasks(syncStatus)');
    await db.execute('CREATE INDEX idx_sync_queue_status ON sync_queue(status)');

    print('✅ Banco de dados criado com sucesso');
  }

  Future<Task> upsertTask(Task task) async {
    final db = await database;
    await db.insert(
      'tasks',
      task.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
    return task;
  }

  Future<Task?> getTask(String id) async {
    final db = await database;
    final maps = await db.query(
      'tasks',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (maps.isEmpty) return null;
    return Task.fromMap(maps.first);
  }

  Future<List<Task>> getAllTasks({String userId = 'user1'}) async {
    final db = await database;
    final maps = await db.query(
      'tasks',
      where: 'userId = ?',
      whereArgs: [userId],
      orderBy: 'updatedAt DESC',
    );

    return maps.map((map) => Task.fromMap(map)).toList();
  }

  Future<List<Task>> getUnsyncedTasks() async {
    final db = await database;
    final maps = await db.query(
      'tasks',
      where: 'syncStatus = ?',
      whereArgs: [SyncStatus.pending.toString()],
    );

    return maps.map((map) => Task.fromMap(map)).toList();
  }

  Future<List<Task>> getConflictedTasks() async {
    final db = await database;
    final maps = await db.query(
      'tasks',
      where: 'syncStatus = ?',
      whereArgs: [SyncStatus.conflict.toString()],
    );

    return maps.map((map) => Task.fromMap(map)).toList();
  }

  Future<int> deleteTask(String id) async {
    final db = await database;
    return await db.delete(
      'tasks',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> updateSyncStatus(String id, SyncStatus status) async {
    final db = await database;
    await db.update(
      'tasks',
      {'syncStatus': status.toString()},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<SyncOperation> addToSyncQueue(SyncOperation operation) async {
    final db = await database;
    await db.insert(
      'sync_queue',
      operation.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
    return operation;
  }

  Future<List<SyncOperation>> getPendingSyncOperations() async {
    final db = await database;
    final maps = await db.query(
      'sync_queue',
      where: 'status = ?',
      whereArgs: [SyncOperationStatus.pending.toString()],
      orderBy: 'timestamp ASC',
    );

    return maps.map((map) => SyncOperation.fromMap(map)).toList();
  }

  Future<void> updateSyncOperation(SyncOperation operation) async {
    final db = await database;
    await db.update(
      'sync_queue',
      operation.toMap(),
      where: 'id = ?',
      whereArgs: [operation.id],
    );
  }

  Future<int> removeSyncOperation(String id) async {
    final db = await database;
    return await db.delete(
      'sync_queue',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> clearCompletedOperations() async {
    final db = await database;
    return await db.delete(
      'sync_queue',
      where: 'status = ?',
      whereArgs: [SyncOperationStatus.completed.toString()],
    );
  }

  Future<void> setMetadata(String key, String value) async {
    final db = await database;
    await db.insert(
      'metadata',
      {'key': key, 'value': value},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<String?> getMetadata(String key) async {
    final db = await database;
    final maps = await db.query(
      'metadata',
      where: 'key = ?',
      whereArgs: [key],
    );

    if (maps.isEmpty) return null;
    return maps.first['value'] as String;
  }

  Future<Map<String, dynamic>> getStats() async {
    final db = await database;
    
    final totalTasks = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM tasks')
    ) ?? 0;
    
    final unsyncedTasks = Sqflite.firstIntValue(
      await db.rawQuery(
        'SELECT COUNT(*) FROM tasks WHERE syncStatus = ?',
        [SyncStatus.pending.toString()]
      )
    ) ?? 0;
    
    final queuedOperations = Sqflite.firstIntValue(
      await db.rawQuery(
        'SELECT COUNT(*) FROM sync_queue WHERE status = ?',
        [SyncOperationStatus.pending.toString()]
      )
    ) ?? 0;
    
    final lastSync = await getMetadata('lastSyncTimestamp');

    return {
      'totalTasks': totalTasks,
      'unsyncedTasks': unsyncedTasks,
      'queuedOperations': queuedOperations,
      'lastSync': lastSync != null ? int.parse(lastSync) : null,
    };
  }

  Future<void> clearAllData() async {
    final db = await database;
    await db.delete('tasks');
    await db.delete('sync_queue');
    await db.delete('metadata');
    print('🗑️ Todos os dados foram limpos');
  }

  Future<void> close() async {
    final db = await database;
    await db.close();
  }
}
