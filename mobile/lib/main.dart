import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:webview_flutter/webview_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  runApp(const GameApp());
}

class GameApp extends StatefulWidget {
  const GameApp({super.key});

  @override
  State<GameApp> createState() => _GameAppState();
}

class _GameAppState extends State<GameApp> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController();
    _loadGame();
  }

  Future<void> _loadGame() async {
    await _controller.setBackgroundColor(const Color(0xff080f1a));
    await _controller.setJavaScriptMode(JavaScriptMode.unrestricted);
    await _controller.loadFlutterAsset('assets/play-demo.html');
  }

  @override
  Widget build(BuildContext context) {
    const background = Color(0xff080f1a);
    return WidgetsApp(
      title: 'Dynasty of Heroes: Tactics',
      debugShowCheckedModeBanner: false,
      color: background,
      builder: (context, child) => ColoredBox(
        color: background,
        child: SafeArea(child: WebViewWidget(controller: _controller)),
      ),
    );
  }
}
