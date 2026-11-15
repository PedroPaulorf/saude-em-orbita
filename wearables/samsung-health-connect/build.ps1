param([string]$SdkRoot = $env:ANDROID_HOME, [switch]$PublishToFrontend)
$ErrorActionPreference = 'Stop'
if (-not $SdkRoot) { $SdkRoot = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'dados-privados/android-sdk' }
if (-not (Test-Path -LiteralPath $SdkRoot)) { throw 'Provide -SdkRoot with Android SDK platform 36 and build-tools 36.0.0.' }
$taskAndroidJar = Get-ChildItem -LiteralPath $SdkRoot -Filter android.jar -Recurse | Where-Object { $_.FullName -match 'android-36[\\/]' } | Select-Object -First 1
$taskAapt = Get-ChildItem -LiteralPath $SdkRoot -Filter aapt2.exe -Recurse | Select-Object -First 1
if (-not $taskAndroidJar -or -not $taskAapt) { throw 'Android platform 36 and build-tools 36.0.0 are required.' }
$taskTools = $taskAapt.DirectoryName
$taskBuild = Join-Path $PSScriptRoot 'build'
$taskClasses = Join-Path $taskBuild 'classes'
$taskDex = Join-Path $taskBuild 'dex'
New-Item -ItemType Directory -Path $taskBuild,$taskClasses,$taskDex -Force | Out-Null
$taskSources = @(Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'src') -Filter *.java -Recurse | ForEach-Object { $_.FullName })
& javac --release 8 -classpath $taskAndroidJar.FullName -d $taskClasses @taskSources
if ($LASTEXITCODE -ne 0) { throw 'Phone Java compilation failed.' }
$taskClassJar = Join-Path $taskBuild 'classes.jar'
& jar --create --file $taskClassJar -C $taskClasses .
if ($LASTEXITCODE -ne 0) { throw 'Class packaging failed.' }
& (Join-Path $taskTools 'd8.bat') --lib $taskAndroidJar.FullName --min-api 34 --output $taskDex $taskClassJar
if ($LASTEXITCODE -ne 0) { throw 'Android dex compilation failed.' }
$taskUnsigned = Join-Path $taskBuild 'health7-fit3-bridge-unsigned.apk'
& $taskAapt.FullName link --manifest (Join-Path $PSScriptRoot 'AndroidManifest.xml') -I $taskAndroidJar.FullName --min-sdk-version 34 --target-sdk-version 36 -o $taskUnsigned
if ($LASTEXITCODE -ne 0) { throw 'Android APK packaging failed.' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskZip = [IO.Compression.ZipFile]::Open($taskUnsigned, 'Update')
try { [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($taskZip, (Join-Path $taskDex 'classes.dex'), 'classes.dex') | Out-Null } finally { $taskZip.Dispose() }
$taskAligned = Join-Path $taskBuild 'health7-fit3-bridge-aligned.apk'
& (Join-Path $taskTools 'zipalign.exe') -f 4 $taskUnsigned $taskAligned
if ($LASTEXITCODE -ne 0) { throw 'APK alignment failed.' }
$taskKeystore = Join-Path $taskBuild 'debug.keystore'
# Public Android debug credentials; this key is for local installation only, never release distribution.
if (-not (Test-Path -LiteralPath $taskKeystore)) {
  & keytool -genkeypair -keystore $taskKeystore -alias androiddebugkey -storepass android -keypass android -keyalg RSA -keysize 2048 -validity 3650 -dname 'CN=Health7 Local Debug'
  if ($LASTEXITCODE -ne 0) { throw 'Debug signing-key creation failed.' }
}
$taskApk = Join-Path $taskBuild 'health7-fit3-bridge-debug.apk'
& (Join-Path $taskTools 'apksigner.bat') sign --ks $taskKeystore --ks-key-alias androiddebugkey --ks-pass pass:android --out $taskApk $taskAligned
if ($LASTEXITCODE -ne 0) { throw 'Debug APK signing failed.' }
& (Join-Path $taskTools 'apksigner.bat') verify --verbose $taskApk
if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
Write-Output ('Built local-test APK: ' + $taskApk)
if ($PublishToFrontend) {
  $taskPublic = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'frontend/public/downloads'
  New-Item -ItemType Directory -Path $taskPublic -Force | Out-Null
  Copy-Item -LiteralPath $taskApk -Destination (Join-Path $taskPublic 'health7-fit3-bridge-debug.apk')
  $taskChecksum = (Get-FileHash -LiteralPath $taskApk -Algorithm SHA256).Hash.ToLowerInvariant()
  [IO.File]::WriteAllText((Join-Path $taskPublic 'health7-fit3-bridge-debug.sha256'), $taskChecksum + '  health7-fit3-bridge-debug.apk' + [Environment]::NewLine)
  Write-Output 'Copied the verified debug APK and SHA-256 to frontend/public/downloads.'
}
