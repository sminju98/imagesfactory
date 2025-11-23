# Flutter 크로스플랫폼 기술 명세서
# imagesfactory Mobile App

**문서 버전**: 1.0  
**작성일**: 2025-11-23  
**플랫폼**: iOS 15+, Android 8.0+

---

## 📋 개요

imagesfactory 모바일 앱은 Flutter 3.x를 사용하여 iOS와 Android를 동시에 지원하는 크로스플랫폼 애플리케이션입니다.

---

## 🏗 전체 아키텍처

```
┌─────────────────────────────────────────┐
│         Flutter App (Dart)              │
│  ┌────────────────────────────────────┐ │
│  │  Presentation Layer (UI)           │ │
│  │  - Widgets, Screens, Animations    │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Business Logic Layer              │ │
│  │  - BLoC/Cubit (State Management)  │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Data Layer                        │ │
│  │  - Repositories, Data Sources      │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
           │           │           │
           ↓           ↓           ↓
    ┌──────────┐  ┌────────┐  ┌─────────┐
    │ Firebase │  │  REST  │  │  Local  │
    │          │  │  API   │  │ Storage │
    └──────────┘  └────────┘  └─────────┘
```

---

## 💻 기술 스택

### Core
- **Flutter**: 3.16+ (Stable)
- **Dart**: 3.2+
- **Platform**: iOS 15+, Android API 26+ (8.0)

### 상태 관리
- **flutter_bloc**: 8.1+ (BLoC 패턴)
- **equatable**: 2.0+ (상태 비교)
- **hydrated_bloc**: 9.1+ (상태 영속성)

### Firebase
- **firebase_core**: 2.24+
- **firebase_auth**: 4.15+
- **cloud_firestore**: 4.13+
- **firebase_storage**: 11.5+
- **firebase_messaging**: 14.7+ (푸시 알림)
- **firebase_analytics**: 10.7+
- **firebase_crashlytics**: 3.4+

### HTTP & API
- **dio**: 5.4+ (HTTP 클라이언트)
- **retrofit**: 4.0+ (API 인터페이스)
- **json_serializable**: 6.7+ (JSON 직렬화)

### 로컬 저장소
- **hive**: 2.2+ (경량 DB)
- **shared_preferences**: 2.2+ (설정 저장)
- **sqflite**: 2.3+ (SQLite, 필요시)

### UI/UX
- **flutter_svg**: 2.0+ (SVG 이미지)
- **cached_network_image**: 3.3+ (이미지 캐싱)
- **shimmer**: 3.0+ (로딩 스켈레톤)
- **lottie**: 2.7+ (애니메이션)
- **flutter_staggered_grid_view**: 0.7+ (그리드)

### 결제
- **in_app_purchase**: 3.1+ (앱 내 구매)
- **stripe_flutter**: 10.1+ (Stripe 결제)
- **flutter_inapp_purchase**: 5.4+ (통합 결제)

### 유틸리티
- **intl**: 0.18+ (다국어, 날짜)
- **url_launcher**: 6.2+ (외부 링크)
- **image_picker**: 1.0+ (이미지 선택)
- **share_plus**: 7.2+ (공유)
- **path_provider**: 2.1+ (파일 경로)
- **permission_handler**: 11.1+ (권한)
- **connectivity_plus**: 5.0+ (네트워크 상태)

### 개발 도구
- **flutter_launcher_icons**: 0.13+ (앱 아이콘)
- **flutter_native_splash**: 2.3+ (스플래시)
- **build_runner**: 2.4+ (코드 생성)
- **flutter_test**: SDK 기본

---

## 📁 프로젝트 구조

```
imagesfactory_app/
├── lib/
│   ├── main.dart                    # 앱 진입점
│   ├── app.dart                     # Material App 설정
│   ├── config/                      # 설정
│   │   ├── routes.dart              # 라우팅
│   │   ├── theme.dart               # 테마
│   │   └── constants.dart           # 상수
│   ├── core/                        # 핵심 기능
│   │   ├── error/                   # 에러 처리
│   │   ├── network/                 # 네트워크
│   │   └── utils/                   # 유틸리티
│   ├── features/                    # 기능별 모듈
│   │   ├── auth/                    # 인증
│   │   │   ├── data/
│   │   │   │   ├── datasources/
│   │   │   │   ├── models/
│   │   │   │   └── repositories/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── repositories/
│   │   │   │   └── usecases/
│   │   │   └── presentation/
│   │   │       ├── bloc/
│   │   │       ├── pages/
│   │   │       └── widgets/
│   │   ├── generation/              # 이미지 생성
│   │   ├── points/                  # 포인트
│   │   ├── profile/                 # 프로필
│   │   └── history/                 # 히스토리
│   └── shared/                      # 공유 컴포넌트
│       ├── widgets/                 # 공통 위젯
│       └── utils/                   # 공통 유틸
├── assets/                          # 정적 자산
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── lottie/
├── android/                         # Android 설정
├── ios/                             # iOS 설정
├── test/                            # 테스트
└── pubspec.yaml                     # 의존성
```

---

## 🔧 주요 구현 사항

## 1. Firebase 초기화

### lib/main.dart
```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'firebase_options.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Firebase 초기화
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // BLoC 옵저버 설정 (디버깅)
  Bloc.observer = AppBlocObserver();
  
  runApp(const ImagesfactoryApp());
}
```

### firebase_options.dart (자동 생성)
```dart
// Firebase CLI로 생성: flutterfire configure
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError('Web is not supported');
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError('Platform not supported');
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAFehtzPYQTzXscJPm2-yqKK5GGXKQDIX0',
    appId: '1:629353944984:android:...',
    messagingSenderId: '629353944984',
    projectId: 'imagefactory-5ccc6',
    storageBucket: 'imagefactory-5ccc6.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyA...',
    appId: '1:629353944984:ios:...',
    messagingSenderId: '629353944984',
    projectId: 'imagefactory-5ccc6',
    storageBucket: 'imagefactory-5ccc6.firebasestorage.app',
    iosClientId: '629353944984.apps.googleusercontent.com',
    iosBundleId: 'com.imagesfactory.app',
  );
}
```

---

## 2. 인증 (Firebase Auth)

### Data Layer
```dart
// lib/features/auth/data/datasources/auth_remote_datasource.dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

abstract class AuthRemoteDataSource {
  Future<User> signInWithEmail(String email, String password);
  Future<User> signUpWithEmail(String email, String password, String name);
  Future<User> signInWithGoogle();
  Future<void> signOut();
  User? getCurrentUser();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final FirebaseAuth _auth;
  final GoogleSignIn _googleSignIn;

  AuthRemoteDataSourceImpl(this._auth, this._googleSignIn);

  @override
  Future<User> signInWithEmail(String email, String password) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      return credential.user!;
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  @override
  Future<User> signUpWithEmail(
    String email,
    String password,
    String name,
  ) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      await credential.user!.updateDisplayName(name);
      await credential.user!.sendEmailVerification();
      
      return credential.user!;
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  @override
  Future<User> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) throw Exception('Google sign in aborted');

      final GoogleSignInAuthentication googleAuth = 
        await googleUser.authentication;

      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential = await _auth.signInWithCredential(credential);
      return userCredential.user!;
    } catch (e) {
      throw Exception('Google sign in failed: $e');
    }
  }

  @override
  Future<void> signOut() async {
    await Future.wait([
      _auth.signOut(),
      _googleSignIn.signOut(),
    ]);
  }

  @override
  User? getCurrentUser() => _auth.currentUser;

  Exception _handleAuthException(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
        return Exception('사용자를 찾을 수 없습니다');
      case 'wrong-password':
        return Exception('잘못된 비밀번호입니다');
      case 'email-already-in-use':
        return Exception('이미 사용 중인 이메일입니다');
      case 'weak-password':
        return Exception('비밀번호가 너무 약합니다');
      default:
        return Exception('인증 오류: ${e.message}');
    }
  }
}
```

### Domain Layer
```dart
// lib/features/auth/domain/entities/user_entity.dart
import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  final String uid;
  final String email;
  final String displayName;
  final String? photoURL;
  final int points;
  final bool emailVerified;

  const UserEntity({
    required this.uid,
    required this.email,
    required this.displayName,
    this.photoURL,
    required this.points,
    required this.emailVerified,
  });

  @override
  List<Object?> get props => [
    uid,
    email,
    displayName,
    photoURL,
    points,
    emailVerified,
  ];
}

// lib/features/auth/domain/usecases/sign_in_usecase.dart
class SignInUseCase {
  final AuthRepository repository;

  SignInUseCase(this.repository);

  Future<UserEntity> call(String email, String password) {
    return repository.signInWithEmail(email, password);
  }
}
```

### Presentation Layer (BLoC)
```dart
// lib/features/auth/presentation/bloc/auth_bloc.dart
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';

// Events
abstract class AuthEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class SignInRequested extends AuthEvent {
  final String email;
  final String password;

  SignInRequested(this.email, this.password);

  @override
  List<Object?> get props => [email, password];
}

class SignUpRequested extends AuthEvent {
  final String email;
  final String password;
  final String name;

  SignUpRequested(this.email, this.password, this.name);

  @override
  List<Object?> get props => [email, password, name];
}

class GoogleSignInRequested extends AuthEvent {}

class SignOutRequested extends AuthEvent {}

// States
abstract class AuthState extends Equatable {
  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class Authenticated extends AuthState {
  final UserEntity user;

  Authenticated(this.user);

  @override
  List<Object?> get props => [user];
}

class Unauthenticated extends AuthState {}

class AuthError extends AuthState {
  final String message;

  AuthError(this.message);

  @override
  List<Object?> get props => [message];
}

// BLoC
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final SignInUseCase signInUseCase;
  final SignUpUseCase signUpUseCase;
  final SignInWithGoogleUseCase signInWithGoogleUseCase;
  final SignOutUseCase signOutUseCase;

  AuthBloc({
    required this.signInUseCase,
    required this.signUpUseCase,
    required this.signInWithGoogleUseCase,
    required this.signOutUseCase,
  }) : super(AuthInitial()) {
    on<SignInRequested>(_onSignInRequested);
    on<SignUpRequested>(_onSignUpRequested);
    on<GoogleSignInRequested>(_onGoogleSignInRequested);
    on<SignOutRequested>(_onSignOutRequested);
  }

  Future<void> _onSignInRequested(
    SignInRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final user = await signInUseCase(event.email, event.password);
      emit(Authenticated(user));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // 나머지 이벤트 핸들러...
}
```

### UI Layer
```dart
// lib/features/auth/presentation/pages/login_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is Authenticated) {
            Navigator.pushReplacementNamed(context, '/home');
          } else if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message)),
            );
          }
        },
        builder: (context, state) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo
                    Text(
                      'imagesfactory',
                      style: Theme.of(context).textTheme.headlineLarge,
                    ),
                    const SizedBox(height: 48),
                    
                    // Email
                    TextFormField(
                      controller: _emailController,
                      decoration: const InputDecoration(
                        labelText: '이메일',
                        prefixIcon: Icon(Icons.email),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return '이메일을 입력해주세요';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    
                    // Password
                    TextFormField(
                      controller: _passwordController,
                      decoration: const InputDecoration(
                        labelText: '비밀번호',
                        prefixIcon: Icon(Icons.lock),
                      ),
                      obscureText: true,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return '비밀번호를 입력해주세요';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    
                    // Login Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: state is AuthLoading
                            ? null
                            : () {
                                if (_formKey.currentState!.validate()) {
                                  context.read<AuthBloc>().add(
                                        SignInRequested(
                                          _emailController.text,
                                          _passwordController.text,
                                        ),
                                      );
                                }
                              },
                        child: state is AuthLoading
                            ? const CircularProgressIndicator()
                            : const Text('로그인'),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Google Sign In
                    OutlinedButton.icon(
                      onPressed: state is AuthLoading
                          ? null
                          : () {
                              context.read<AuthBloc>().add(
                                    GoogleSignInRequested(),
                                  );
                            },
                      icon: const Icon(Icons.g_mobiledata),
                      label: const Text('Google로 로그인'),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
```

---

## 3. 이미지 생성

### Generation BLoC
```dart
// lib/features/generation/presentation/bloc/generation_bloc.dart
class GenerationBloc extends Bloc<GenerationEvent, GenerationState> {
  final CreateGenerationUseCase createGenerationUseCase;
  final GetGenerationStatusUseCase getGenerationStatusUseCase;
  
  GenerationBloc({
    required this.createGenerationUseCase,
    required this.getGenerationStatusUseCase,
  }) : super(GenerationInitial()) {
    on<CreateGenerationRequested>(_onCreateGenerationRequested);
    on<GenerationStatusPolled>(_onGenerationStatusPolled);
  }

  Future<void> _onCreateGenerationRequested(
    CreateGenerationRequested event,
    Emitter<GenerationState> emit,
  ) async {
    emit(GenerationCreating());
    try {
      final generationId = await createGenerationUseCase(
        CreateGenerationParams(
          prompt: event.prompt,
          email: event.email,
          models: event.models,
        ),
      );
      
      emit(GenerationCreated(generationId));
      
      // Start polling
      add(GenerationStatusPolled(generationId));
    } catch (e) {
      emit(GenerationError(e.toString()));
    }
  }

  Future<void> _onGenerationStatusPolled(
    GenerationStatusPolled event,
    Emitter<GenerationState> emit,
  ) async {
    try {
      await for (final status in getGenerationStatusUseCase(event.id)) {
        if (status.status == 'completed') {
          emit(GenerationCompleted(status));
          break;
        } else if (status.status == 'failed') {
          emit(GenerationError(status.failedReason ?? 'Unknown error'));
          break;
        } else {
          emit(GenerationProcessing(status));
        }
      }
    } catch (e) {
      emit(GenerationError(e.toString()));
    }
  }
}
```

### Generation UI
```dart
// lib/features/generation/presentation/pages/create_page.dart
class CreatePage extends StatefulWidget {
  @override
  _CreatePageState createState() => _CreatePageState();
}

class _CreatePageState extends State<CreatePage> {
  final _promptController = TextEditingController();
  final _emailController = TextEditingController();
  
  final Map<String, int> _selectedModels = {};

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('이미지 생성'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Prompt
            TextField(
              controller: _promptController,
              decoration: const InputDecoration(
                labelText: '프롬프트',
                hintText: '생성하고 싶은 이미지를 설명해주세요...',
              ),
              maxLines: 5,
            ),
            const SizedBox(height: 24),
            
            // Email
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: '결과 받을 이메일',
                prefixIcon: Icon(Icons.email),
              ),
            ),
            const SizedBox(height: 24),
            
            // AI Models
            const Text(
              'AI 모델 선택',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            ..._buildModelCards(),
            
            const SizedBox(height: 24),
            
            // Cost Summary
            _buildCostSummary(),
            
            const SizedBox(height: 24),
            
            // Generate Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _onGenerate,
                child: const Text('이미지 생성하기'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildModelCards() {
    final models = [
      AIModel(
        id: 'dall-e-3',
        name: 'DALL-E 3',
        description: '최고 품질',
        pointsPerImage: 200,
      ),
      AIModel(
        id: 'sdxl',
        name: 'Stable Diffusion XL',
        description: '빠르고 저렴',
        pointsPerImage: 100,
      ),
      // ...
    ];

    return models.map((model) {
      return Card(
        child: CheckboxListTile(
          title: Text(model.name),
          subtitle: Text('${model.description} • ${model.pointsPerImage}pt/장'),
          value: _selectedModels.containsKey(model.id),
          onChanged: (selected) {
            setState(() {
              if (selected == true) {
                _selectedModels[model.id] = 10; // 기본 10장
              } else {
                _selectedModels.remove(model.id);
              }
            });
          },
          secondary: _selectedModels.containsKey(model.id)
              ? DropdownButton<int>(
                  value: _selectedModels[model.id],
                  items: List.generate(50, (i) => i + 1)
                      .map((count) => DropdownMenuItem(
                            value: count,
                            child: Text('$count장'),
                          ))
                      .toList(),
                  onChanged: (count) {
                    setState(() {
                      _selectedModels[model.id] = count!;
                    });
                  },
                )
              : null,
        ),
      );
    }).toList();
  }

  Widget _buildCostSummary() {
    int totalPoints = 0;
    int totalImages = 0;
    
    _selectedModels.forEach((modelId, count) {
      final model = getModelById(modelId);
      totalPoints += model.pointsPerImage * count;
      totalImages += count;
    });

    return Card(
      color: Theme.of(context).colorScheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('총 이미지'),
                Text(
                  '$totalImages장',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('총 비용'),
                Text(
                  '$totalPoints 포인트',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _onGenerate() {
    if (_selectedModels.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('최소 1개의 모델을 선택해주세요')),
      );
      return;
    }

    context.read<GenerationBloc>().add(
          CreateGenerationRequested(
            prompt: _promptController.text,
            email: _emailController.text,
            models: _selectedModels,
          ),
        );
    
    Navigator.pushNamed(context, '/generation/progress');
  }
}
```

---

## 4. 푸시 알림 (Firebase Messaging)

### Setup
```dart
// lib/core/services/notification_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    // 권한 요청
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // FCM 토큰 가져오기
    final token = await _messaging.getToken();
    print('FCM Token: $token');
    
    // 토큰 변경 리스너
    _messaging.onTokenRefresh.listen((token) {
      // 서버에 토큰 업데이트
      _updateTokenOnServer(token);
    });

    // 로컬 알림 초기화
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iOS = DarwinInitializationSettings();
    const settings = InitializationSettings(android: android, iOS: iOS);
    
    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // 포그라운드 메시지 핸들러
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // 백그라운드 메시지 핸들러
    FirebaseMessaging.onMessageOpenedApp.listen(_handleBackgroundMessage);
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    print('Foreground message: ${message.messageId}');
    
    // 로컬 알림 표시
    await _showLocalNotification(
      title: message.notification?.title ?? 'imagesfactory',
      body: message.notification?.body ?? '',
      payload: message.data['generationId'],
    );
  }

  Future<void> _showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'imagesfactory_channel',
      'imagesfactory',
      channelDescription: 'imagesfactory 알림',
      importance: Importance.max,
      priority: Priority.high,
    );

    const iOSDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iOSDetails,
    );

    await _localNotifications.show(
      0,
      title,
      body,
      details,
      payload: payload,
    );
  }

  void _onNotificationTapped(NotificationResponse response) {
    final payload = response.payload;
    if (payload != null) {
      // 해당 생성 작업 화면으로 이동
      navigatorKey.currentState?.pushNamed(
        '/generation/detail',
        arguments: payload,
      );
    }
  }

  void _handleBackgroundMessage(RemoteMessage message) {
    print('Background message: ${message.messageId}');
    // 앱이 백그라운드에서 알림을 탭했을 때
    _onNotificationTapped(NotificationResponse(
      notificationResponseType: NotificationResponseType.selectedNotification,
      payload: message.data['generationId'],
    ));
  }

  Future<void> _updateTokenOnServer(String token) async {
    // Firestore에 토큰 저장
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .update({'fcmToken': token});
    }
  }
}
```

---

## 5. 앱 결제 (In-App Purchase)

### iOS (App Store)
```dart
// lib/features/points/data/datasources/payment_datasource.dart
import 'package:in_app_purchase/in_app_purchase.dart';

class PaymentDataSource {
  final InAppPurchase _iap = InAppPurchase.instance;

  Future<void> initializeStore() async {
    final available = await _iap.isAvailable();
    if (!available) {
      throw Exception('Store not available');
    }

    // 상품 ID
    const productIds = {
      'com.imagesfactory.points.starter',
      'com.imagesfactory.points.basic',
      'com.imagesfactory.points.pro',
      'com.imagesfactory.points.business',
    };

    // 상품 조회
    final response = await _iap.queryProductDetails(productIds);
    
    if (response.error != null) {
      throw Exception('Failed to query products: ${response.error}');
    }

    // 구매 리스너
    _iap.purchaseStream.listen(_handlePurchaseUpdates);
  }

  Future<void> purchase(String productId) async {
    final products = await _getProducts();
    final product = products.firstWhere((p) => p.id == productId);

    final purchaseParam = PurchaseParam(productDetails: product);
    await _iap.buyConsumable(purchaseParam: purchaseParam);
  }

  void _handlePurchaseUpdates(List<PurchaseDetails> purchases) {
    for (final purchase in purchases) {
      if (purchase.status == PurchaseStatus.purchased) {
        // 서버에서 검증
        _verifyPurchase(purchase);
      } else if (purchase.status == PurchaseStatus.error) {
        // 에러 처리
        print('Purchase error: ${purchase.error}');
      }

      // 완료 처리
      if (purchase.pendingCompletePurchase) {
        _iap.completePurchase(purchase);
      }
    }
  }

  Future<void> _verifyPurchase(PurchaseDetails purchase) async {
    // 서버에서 영수증 검증
    await _dio.post('/api/payment/verify-ios', data: {
      'receipt': purchase.verificationData.serverVerificationData,
      'productId': purchase.productID,
    });
  }
}
```

### Android (Google Play)
```dart
// 동일한 in_app_purchase 패키지 사용
// Android는 자동으로 처리됨
```

---

## 6. 테마 & 다크모드

```dart
// lib/config/theme.dart
import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF6366F1), // Primary
        brightness: Brightness.light,
      ),
      fontFamily: 'Pretendard',
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        filled: true,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF6366F1),
        brightness: Brightness.dark,
      ),
      fontFamily: 'Pretendard',
      // ... 동일한 스타일
    );
  }
}
```

---

## 📱 플랫폼별 설정

### iOS 설정

#### ios/Runner/Info.plist
```xml
<key>CFBundleDisplayName</key>
<string>imagesfactory</string>

<key>NSCameraUsageDescription</key>
<string>프로필 사진을 설정하기 위해 카메라 접근이 필요합니다</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>프로필 사진을 선택하기 위해 사진 라이브러리 접근이 필요합니다</string>

<key>UIBackgroundModes</key>
<array>
  <string>fetch</string>
  <string>remote-notification</string>
</array>
```

### Android 설정

#### android/app/build.gradle
```gradle
android {
    defaultConfig {
        applicationId "com.imagesfactory.app"
        minSdkVersion 26
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-analytics'
}
```

#### android/app/src/main/AndroidManifest.xml
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>

<application
    android:label="imagesfactory"
    android:icon="@mipmap/ic_launcher">
    
    <!-- Firebase Messaging -->
    <service
        android:name="com.google.firebase.messaging.FirebaseMessagingService"
        android:exported="false">
        <intent-filter>
            <action android:name="com.google.firebase.MESSAGING_EVENT"/>
        </intent-filter>
    </service>
</application>
```

---

## 🧪 테스트

### 유닛 테스트
```dart
// test/features/auth/domain/usecases/sign_in_usecase_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';

void main() {
  late SignInUseCase useCase;
  late MockAuthRepository mockRepository;

  setUp(() {
    mockRepository = MockAuthRepository();
    useCase = SignInUseCase(mockRepository);
  });

  test('should sign in successfully', () async {
    // Arrange
    const email = 'test@example.com';
    const password = 'password123';
    final expectedUser = UserEntity(/* ... */);
    
    when(mockRepository.signInWithEmail(email, password))
        .thenAnswer((_) async => expectedUser);

    // Act
    final result = await useCase(email, password);

    // Assert
    expect(result, expectedUser);
    verify(mockRepository.signInWithEmail(email, password));
  });
}
```

### 위젯 테스트
```dart
// test/features/auth/presentation/pages/login_page_test.dart
void main() {
  testWidgets('LoginPage renders correctly', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: BlocProvider(
          create: (_) => MockAuthBloc(),
          child: LoginPage(),
        ),
      ),
    );

    expect(find.text('imagesfactory'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(2));
    expect(find.text('로그인'), findsOneWidget);
  });
}
```

---

## 🚀 빌드 & 배포

### Android
```bash
# 디버그 빌드
flutter build apk --debug

# 릴리즈 빌드
flutter build apk --release
flutter build appbundle --release

# Play Store 업로드
# android/key.properties 설정 필요
```

### iOS
```bash
# 디버그 빌드
flutter build ios --debug

# 릴리즈 빌드
flutter build ios --release

# Xcode로 열기
open ios/Runner.xcworkspace

# App Store Connect 업로드
# Xcode > Product > Archive
```

---

**문서 히스토리**
- v1.0 (2025-11-23): 초안 작성

