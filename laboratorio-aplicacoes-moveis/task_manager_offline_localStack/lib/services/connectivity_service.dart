import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// Serviço de conectividade: verifica rede e acessibilidade do servidor
class ConnectivityService {
  static final ConnectivityService instance = ConnectivityService._init();
  
  final Connectivity _connectivity = Connectivity();
  final _connectivityController = StreamController<bool>.broadcast();
  
  bool _hasNetwork = false;
  bool _serverReachable = false;
  bool _isOnline = false;
  
  StreamSubscription<ConnectivityResult>? _subscription;
  Timer? _serverCheckTimer;
  
  static const _serverCheckInterval = Duration(seconds: 5);
  
  ConnectivityService._init();

  static String get _healthUrl {
    if (kIsWeb) {
      return 'http://localhost:3000/api/health';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000/api/health';
    }
    return 'http://localhost:3000/api/health';
  }

  Stream<bool> get connectivityStream => _connectivityController.stream;
  bool get isOnline => _isOnline;
  bool get hasNetwork => _hasNetwork;
  bool get isServerReachable => _serverReachable;

  Future<void> initialize() async {
    final result = await _connectivity.checkConnectivity();
    await _updateNetworkStatus(result);
    _subscription = _connectivity.onConnectivityChanged.listen(_updateNetworkStatus);
    _startServerCheck();
    
    print('✅ Serviço de conectividade inicializado');
    print('   📡 Rede: ${_hasNetwork ? "Disponível" : "Indisponível"}');
    print('   🖥️  Servidor: ${_serverReachable ? "Acessível" : "Inacessível"}');
  }

  Future<void> _updateNetworkStatus(ConnectivityResult result) async {
    _hasNetwork = result != ConnectivityResult.none;
    
    if (_hasNetwork) {
      await _checkServerReachability();
    } else {
      _serverReachable = false;
      _updateOnlineStatus();
    }
  }

  Future<bool> _checkServerReachability() async {
    try {
      final response = await http.get(
        Uri.parse(_healthUrl),
      ).timeout(const Duration(seconds: 3));
      
      _serverReachable = response.statusCode == 200;
    } catch (e) {
      _serverReachable = false;
    }
    
    _updateOnlineStatus();
    return _serverReachable;
  }

  void _updateOnlineStatus() {
    final wasOnline = _isOnline;
    _isOnline = _hasNetwork && _serverReachable;

    if (wasOnline != _isOnline) {
      if (_isOnline) {
        print('🟢 ONLINE - Rede disponível e servidor acessível');
      } else if (_hasNetwork && !_serverReachable) {
        print('🟡 OFFLINE - Rede disponível mas servidor inacessível');
      } else {
        print('🔴 OFFLINE - Sem conexão de rede');
      }
      _connectivityController.add(_isOnline);
    }
  }

  void _startServerCheck() {
    _serverCheckTimer?.cancel();
    _serverCheckTimer = Timer.periodic(_serverCheckInterval, (timer) async {
      if (_hasNetwork && !_serverReachable) {
        await _checkServerReachability();
      } else if (_hasNetwork && _serverReachable) {
        await _checkServerReachability();
      }
    });
  }

  Future<bool> checkConnectivity() async {
    final result = await _connectivity.checkConnectivity();
    await _updateNetworkStatus(result);
    return _isOnline;
  }
  
  Future<bool> checkServerNow() async {
    if (!_hasNetwork) return false;
    return await _checkServerReachability();
  }

  void dispose() {
    _subscription?.cancel();
    _serverCheckTimer?.cancel();
    _connectivityController.close();
  }
}
