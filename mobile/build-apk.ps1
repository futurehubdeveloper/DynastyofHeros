param(
    [string]$Flutter = 'flutter',
    [string]$AndroidSdk = $env:ANDROID_HOME
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
if ($AndroidSdk) {
    $env:ANDROID_HOME = $AndroidSdk
    $env:ANDROID_SDK_ROOT = $AndroidSdk
}

function Invoke-Flutter {
    & $Flutter @args
    if ($LASTEXITCODE -ne 0) {
        throw "Flutter exited with code $LASTEXITCODE."
    }
}

Push-Location $PSScriptRoot
try {
    if (-not (Test-Path 'android/app/src/main/AndroidManifest.xml')) {
        Invoke-Flutter create --platforms=android --project-name dynasty_of_heroes --org com.dynastyofheroes --empty --no-pub .
        $wrapper = Join-Path $PSScriptRoot 'android/gradle/wrapper/gradle-wrapper.properties'
        $wrapperText = [IO.File]::ReadAllText($wrapper).Replace('-all.zip', '-bin.zip')
        [IO.File]::WriteAllText($wrapper, $wrapperText)
    }

    $manifest = Join-Path $PSScriptRoot 'android/app/src/main/AndroidManifest.xml'
    $manifestText = [IO.File]::ReadAllText($manifest)
    $manifestText = $manifestText.Replace('android:label="dynasty_of_heroes"', 'android:label="Dynasty of Heroes"')
    [IO.File]::WriteAllText($manifest, $manifestText)

    $assets = New-Item -ItemType Directory -Force (Join-Path $PSScriptRoot 'assets')
    $game = [IO.File]::ReadAllText((Join-Path $repo 'play-demo.html'))
    $game = [regex]::Replace($game, '<a href="game\.html"[^>]*>[^<]*</a>', '')
    $apkStyles = '<style>.help{display:none} @media (max-height:460px) and (orientation:landscape){.mobile-message{display:block;padding:5px 8px;font-size:12px} #frame{width:min(100vw,calc((100dvh - 30px) * 16 / 9))}}</style>'
    $game = $game.Replace('</head>', "$apkStyles</head>")
    [IO.File]::WriteAllText((Join-Path $assets.FullName 'play-demo.html'), $game)

    Invoke-Flutter pub get
    Invoke-Flutter analyze
    Invoke-Flutter build apk --release
    $output = Join-Path $PSScriptRoot 'build/app/outputs/flutter-apk/app-release.apk'
    if (-not (Test-Path $output)) {
        throw 'Flutter build completed without producing the expected APK.'
    }
    Copy-Item $output (Join-Path $repo 'Dynasty-of-Heroes.apk') -Force
} finally {
    Pop-Location
}
