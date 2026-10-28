import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Smartphone, Download, CheckCircle, ExternalLink, Copy, Check, X, ShieldCheck, Zap } from 'lucide-react';

interface DownloadApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadApkModal: React.FC<DownloadApkModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const currentAppUrl = window.location.origin;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleOneClickInstall = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleDownloadManifestBundle = () => {
    const manifestBundle = {
      name: 'RUN 4 BISWAS',
      short_name: 'RUN4BISWAS',
      package_id: 'com.run4biswas.app',
      start_url: currentAppUrl,
      display: 'standalone',
      background_color: '#FFFFFF',
      theme_color: '#0052FF',
      description: 'Daily morning running fitness app with smart wake-up alarm missions, real-time GPS tracking, local weather conditions, and AI coaching.',
      icons: [
        { src: `${currentAppUrl}/pwa-192x192.png`, sizes: '192x192', type: 'image/png' },
        { src: `${currentAppUrl}/pwa-512x512.png`, sizes: '512x512', type: 'image/png' },
        { src: `${currentAppUrl}/pwa-maskable-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifestBundle, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'run-4-biswas-android-config.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Download / Install on Android
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                RUN 4 BISWAS Native Standalone App
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          
          {/* Method 1: Direct 1-Click Install (PWA Android Native) */}
          <div className="p-4 rounded-2xl border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-white dark:bg-blue-900/60 px-2.5 py-0.5 rounded-full shadow-xs">
                Recommended · Instant Install
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                No Unknown APK Warnings
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Install Directly to Android Home Screen & Launcher
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Installs RUN 4 BISWAS as a standalone app with full-screen experience, hardware GPS route tracking, morning alarm missions, and background YouTube audio.
            </p>

            {isInstallable ? (
              <button
                type="button"
                onClick={handleOneClickInstall}
                className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{installSuccess ? 'App Installed!' : 'Install RUN 4 BISWAS to Phone'}</span>
              </button>
            ) : isInstalled ? (
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>RUN 4 BISWAS is already installed as a standalone app!</span>
              </div>
            ) : (
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white mb-1">
                  How to install on Android Chrome:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Open this URL in Google Chrome on your Android device.</li>
                  <li>Tap the <strong>⋮ (three dots)</strong> menu in the top right.</li>
                  <li>Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</li>
                  <li>The app icon appears on your home screen and launcher!</li>
                </ol>
              </div>
            )}
          </div>

          {/* Method 2: Convert to Standalone Signed APK File */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Generate Standalone APK File (PWABuilder)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              You can package this web app into a signed Android <code>.apk</code> file in 30 seconds using Google/Microsoft PWABuilder:
            </p>

            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                readOnly
                value={currentAppUrl}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono-numbers text-slate-700 dark:text-slate-300"
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <a
                href={`https://www.pwabuilder.com/?site=${encodeURIComponent(currentAppUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <span>Generate APK on PWABuilder</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={handleDownloadManifestBundle}
                className="w-full sm:w-auto py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-xl transition-colors cursor-pointer text-center"
                title="Download manifest and icons package"
              >
                Export Config JSON
              </button>
            </div>
          </div>

          {/* iOS Safari note if user happens to be on iPhone */}
          {isIOS && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <strong>iPhone / iPad Notice:</strong> Tap the <strong>Share</strong> button in Safari, then tap <strong>&quot;Add to Home Screen&quot;</strong>.
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
