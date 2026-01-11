import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// Serviço de monitoramento de conectividade de rede
/// 
/// Verifica DUAS condições para considerar "online":
/// 1. Dispositivo tem conexão de rede (WiFi, dados móveis)
/// 2. Servidor API está acessível (responde ao health check)
class ConnectivityService {
  static final ConnectivityService instance = ConnectivityService._init();
  
  final Connectivity _connectivity = Connectivity();
  final _connectivityController = StreamController<bool>.broadcast();
  
  bool _hasNetwork = false;      // Dispositivo tem rede?
  bool _serverReachable = false; // Servidor responde?
  bool _isOnline = false;        // Combinação dos dois
  
  StreamSubscription<ConnectivityResult>? _subscription;
  Timer? _serverCheckTimer;
  
  // Intervalo para verificar servidor (quando tem rede mas servidor não responde)
  static const _serverCheckInterval = Duration(seconds: 5);

  ConnectivityService._init();

  /// URL base da API para health check
  static String get _healthUrl {
    if (kIsWeb) {
      return 'http://localhost:3000/api/health';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000/api/health';
    }
    return 'http://localhost:3000/api/health';
  }

  /// Stream de status de conectividade
  Stream<bool> get connectivityStream => _connectivityController.stream;

  /// Status atual de conectividade (rede + servidor acessível)
  bool get isOnline => _isOnline;
  
  /// Apenas status de rede do dispositivo
  bool get hasNetwork => _hasNetwork;
  
  /// Servidor está acessível?
  bool get isServerReachable => _serverReachable;

  /// Inicializar monitoramento
  Future<void> initialize() async {
    // Verificar estado inicial da rede
    final result = await _connectivity.checkConnectivity();
    await _updateNetworkStatus(result);

    // Escutar mudanças de rede
    _subscription = _connectivity.onConnectivityChanged.listen(_updateNetworkStatus);

    // Iniciar verificação periódica do servidor
    _startServerCheck();
    
    print('✅ Serviço de conectividade inicializado');
    print('   📡 Rede: ${_hasNetwork ? "Disponível" : "Indisponível"}');
    print('   🖥️  Servidor: ${_serverReachable ? "Acessível" : "Inacessível"}');
  }

  /// Atualiza status de rede do dispositivo
  Future<void> _updateNetworkStatus(ConnectivityResult result) async {
    _hasNetwork = result != ConnectivityResult.none;
    
    if (_hasNetwork) {
      // Tem rede, verificar se servidor está acessível
      await _checkServerReachability();
    } else {
      // Sem rede, servidor certamente não está acessível
      _serverReachable = false;
      _updateOnlineStatus();
    }
  }

  /// Verifica se o servidor está acessível
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

  /// Atualiza o status combinado de online
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

  /// Inicia verificação periódica do servidor
  void _startServerCheck() {
    _serverCheckTimer?.cancel();
    _serverCheckTimer = Timer.periodic(_serverCheckInterval, (timer) async {
      if (_hasNetwork && !_serverReachable) {
        // Tem rede mas servidor não responde - tentar novamente
        await _checkServerReachability();
      } else if (_hasNetwork && _serverReachable) {
        // Verificar se servidor ainda está acessível
        await _checkServerReachability();
      }
    });
  }

  /// Verificar conectividade manualmente
  Future<bool> checkConnectivity() async {
    final result = await _connectivity.checkConnectivity();
    await _updateNetworkStatus(result);
    return _isOnline;
  }
  
  /// Forçar verificação do servidor
  Future<bool> checkServerNow() async {
    if (!_hasNetwork) return false;
    return await _checkServerReachability();
  }

  /// Dispose
  void dispose() {
    _subscription?.cancel();
    _serverCheckTimer?.cancel();
    _connectivityController.close();
  }
}
