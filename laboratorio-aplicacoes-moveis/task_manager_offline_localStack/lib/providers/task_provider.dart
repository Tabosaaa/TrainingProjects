import 'package:flutter/foundation.dart';
import '../models/task.dart';
import '../services/database_service.dart';
import '../services/sync_service.dart';

class TaskProvider with ChangeNotifier {
  final DatabaseService _db = DatabaseService.instance;
  final SyncService _syncService;

  List<Task> _tasks = [];
  bool _isLoading = false;
  String? _error;

  TaskProvider({String userId = 'user1'})
      : _syncService = SyncService(userId: userId);

  List<Task> get tasks => _tasks;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  List<Task> get completedTasks =>
      _tasks.where((task) => task.completed).toList();
  
  List<Task> get pendingTasks =>
      _tasks.where((task) => !task.completed).toList();
  
  List<Task> get unsyncedTasks =>
      _tasks.where((task) => task.syncStatus == SyncStatus.pending).toList();

  Future<void> initialize() async {
    await loadTasks();
    _syncService.startAutoSync();
    _syncService.syncStatusStream.listen((event) {
      if (event.type == SyncEventType.completed) {
        loadTasks();
      }
    });
  }

  Future<void> loadTasks() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _tasks = await _db.getAllTasks();
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createTask({
    required String title,
    required String description,
    String priority = 'medium',
    String? imagePath,
  }) async {
    try {
      final task = Task(
        title: title,
        description: description,
        priority: priority,
        imagePath: imagePath,
      );

      await _syncService.createTask(task);
      await loadTasks();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> updateTask(Task task) async {
    try {
      await _syncService.updateTask(task);
      await loadTasks();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> toggleCompleted(Task task) async {
    await updateTask(task.copyWith(completed: !task.completed));
  }

  Future<void> deleteTask(String taskId) async {
    try {
      await _syncService.deleteTask(taskId);
      await loadTasks();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<SyncResult> sync() async {
    final result = await _syncService.sync();
    await loadTasks();
    return result;
  }

  Future<SyncStats> getSyncStats() async {
    return await _syncService.getStats();
  }

  @override
  void dispose() {
    _syncService.dispose();
    super.dispose();
  }
}
