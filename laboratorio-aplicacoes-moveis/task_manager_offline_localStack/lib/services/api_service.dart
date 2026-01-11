import 'dart:convert';
import 'dart:io' show File, Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import '../models/task.dart';

class ApiService {
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:3000/api';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000/api';
    }
    return 'http://localhost:3000/api';
  }
  
  final String userId;

  ApiService({this.userId = 'user1'});

  Future<Map<String, dynamic>> getTasks({int? modifiedSince}) async {
    try {
      final uri = Uri.parse('$baseUrl/tasks').replace(
        queryParameters: {
          'userId': userId,
          if (modifiedSince != null) 'modifiedSince': modifiedSince.toString(),
        },
      );

      final response = await http.get(uri).timeout(
        const Duration(seconds: 10),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'tasks': (data['tasks'] as List)
              .map((json) => Task.fromJson(json))
              .toList(),
          'lastSync': data['lastSync'],
          'serverTime': data['serverTime'],
        };
      } else {
        throw Exception('Erro ao buscar tarefas: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro na requisição getTasks: $e');
      rethrow;
    }
  }

  Future<Task> createTask(Task task, {String? imagePath}) async {
    try {
      final Map<String, dynamic> body = task.toJson();
      
      if (imagePath != null && imagePath.isNotEmpty) {
        final imageBase64 = await _encodeImageToBase64(imagePath);
        if (imageBase64 != null) {
          body['imageBase64'] = imageBase64;
        }
      }
      
      final response = await http.post(
        Uri.parse('$baseUrl/tasks'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        return Task.fromJson(data['task']);
      } else {
        throw Exception('Erro ao criar tarefa: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro na requisição createTask: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> updateTask(Task task, {String? imagePath}) async {
    try {
      final Map<String, dynamic> body = {
        ...task.toJson(),
        'version': task.version,
      };
      
      if (imagePath != null && imagePath.isNotEmpty) {
        final imageBase64 = await _encodeImageToBase64(imagePath);
        if (imageBase64 != null) {
          body['imageBase64'] = imageBase64;
        }
      }
      
      final response = await http.put(
        Uri.parse('$baseUrl/tasks/${task.id}'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'task': Task.fromJson(data['task']),
        };
      } else if (response.statusCode == 409) {
        final data = json.decode(response.body);
        return {
          'success': false,
          'conflict': true,
          'serverTask': Task.fromJson(data['serverTask']),
        };
      } else {
        throw Exception('Erro ao atualizar tarefa: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro na requisição updateTask: $e');
      rethrow;
    }
  }

  Future<bool> deleteTask(String id, int version) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/tasks/$id?version=$version'),
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200 || response.statusCode == 404;
    } catch (e) {
      print('❌ Erro na requisição deleteTask: $e');
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> syncBatch(
    List<Map<String, dynamic>> operations,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/sync/batch'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'operations': operations}),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data['results']);
      } else {
        throw Exception('Erro no sync em lote: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro na requisição syncBatch: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> uploadImage(String imagePath, String taskId) async {
    try {
      final imageBase64 = await _encodeImageToBase64(imagePath);
      if (imageBase64 == null) return null;
      
      final response = await http.post(
        Uri.parse('$baseUrl/images/upload'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'imageBase64': imageBase64,
          'taskId': taskId,
          'fileName': imagePath.split('/').last,
        }),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        print('📷 Imagem enviada para S3: ${data['imageUrl']}');
        return data;
      } else {
        throw Exception('Erro no upload: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro no upload de imagem: $e');
      return null;
    }
  }

  Future<String?> _encodeImageToBase64(String imagePath) async {
    try {
      final file = File(imagePath);
      if (!await file.exists()) {
        print('⚠️ Arquivo de imagem não encontrado: $imagePath');
        return null;
      }
      
      final bytes = await file.readAsBytes();
      final base64String = base64Encode(bytes);
      print('📷 Imagem codificada: ${(bytes.length / 1024).toStringAsFixed(2)} KB');
      return base64String;
    } catch (e) {
      print('❌ Erro ao codificar imagem: $e');
      return null;
    }
  }

  Future<bool> checkConnectivity() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/health'),
      ).timeout(const Duration(seconds: 5));

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
