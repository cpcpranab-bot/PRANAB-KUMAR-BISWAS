import React, { useState, useEffect } from 'react';
import { WeatherData, fetchLocalWeatherData, PRESET_LOCATIONS } from '../../services/weatherService';
import { CloudSun, Sun, Cloud, CloudRain, Wind, Droplets, Compass, RefreshCw, Sunrise, ShieldCheck, MapPin, ChevronDown } from 'lucide-react';

interface WeatherWidgetProps {
  onStartRun?: () => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ onStartRun }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [useFahrenheit, setUseFahrenheit] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(PRESET_LOCATIONS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const loadWeather = async (loc = selectedLocation) => {
    setLoading(true);
    try {
      if (loc.isCurrent && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const data = await fetchLocalWeatherData(pos.coords.latitude, pos.coords.longitude, 'Your GPS Location');
            setWeather(data);
            setLoading(false);
          },
          async () => {
            const data = await fetchLocalWeatherData(loc.lat, loc.lng, 'San Francisco, CA');
            setWeather(data);
            setLoading(false);
          },
          { timeout: 6000 }
        );
      } else {
        const data = await fetchLocalWeatherData(loc.lat, loc.lng, loc.name);
        setWeather(data);
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, []);

  const handleSelectLocation = (loc: typeof PRESET_LOCATIONS[0]) => {
    setSelectedLocation(loc);
    setDropdownOpen(false);
    loadWeather(loc);
  };

  const renderWeatherIcon = (type: WeatherData['conditionType']) => {
    switch (type) {
      case 'clear':
        return <Sun className="w-8 h-8 text-amber-500 animate-pulse" />;
      case 'partly_cloudy':
        return <CloudSun className="w-8 h-8 text-blue-500" />;
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-slate-400" />;
      case 'rain':
        return <CloudRain className="w-8 h-8 text-blue-600" />;
      case 'wind':
        return <Wind className="w-8 h-8 text-teal-500" />;
      default:
        return <CloudSun className="w-8 h-8 text-blue-500" />;
    }
  };

  if (!weather && loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-pulse flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-48 h-3 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        </div>
        <div className="w-20 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (!weather) return null;

  const tempDisplay = useFahrenheit ? `${weather.temperatureF}°F` : `${weather.temperatureC}°C`;
  const feelsLikeDisplay = useFahrenheit ? `${weather.apparentTempF}°F` : `${weather.apparentTempC}°C`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm transition-all relative overflow-hidden">
      
      {/* Top Bar: Location Switcher & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        
        {/* Location Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>{weather.locationName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-1.5 animate-fadeIn">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Select Morning Running City
              </div>
              {PRESET_LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className={`w-full text-left px-2.5 py-2 text-xs rounded-xl font-medium transition-colors cursor-pointer flex items-center justify-between ${
                    selectedLocation.name === loc.name
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{loc.name}</span>
                  {loc.isCurrent && <span className="text-[10px] text-blue-600 uppercase font-semibold">GPS</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Controls: Unit toggle & Refresh */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setUseFahrenheit(!useFahrenheit)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold font-mono-numbers text-slate-700 dark:text-slate-300 hover:text-blue-600 cursor-pointer transition-colors"
            title="Switch °C / °F"
          >
            {useFahrenheit ? '°F (Tap for °C)' : '°C (Tap for °F)'}
          </button>

          <button
            type="button"
            onClick={() => loadWeather()}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Refresh local weather"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>

      </div>

      {/* Main Weather Hero Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mb-5">
        
        {/* Left: Temp and Condition */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
            {renderWeatherIcon(weather.conditionType)}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-mono-numbers tracking-tight">
                {tempDisplay}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Feels {feelsLikeDisplay}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {weather.conditionText}
            </h4>
          </div>
        </div>

        {/* Middle: Sunrise Timing Highlight */}
        <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sunrise className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Dawn Sunrise
            </span>
            <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono-numbers">
              {weather.sunriseTime}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Optimal morning light window
            </p>
          </div>
        </div>

        {/* Right: Running Suitability Index Badge */}
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Run Suitability
              </span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white">
                {weather.runningSuitability.level} ({weather.runningSuitability.score}%)
              </div>
            </div>
          </div>
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
        </div>

      </div>

      {/* 4-Item Weather Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center mb-4 text-xs">
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-bold">Humidity</span>
          <div className="font-extrabold text-slate-800 dark:text-slate-200 font-mono-numbers mt-0.5">
            {weather.humidity}%
          </div>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-bold">Wind Speed</span>
          <div className="font-extrabold text-slate-800 dark:text-slate-200 font-mono-numbers mt-0.5">
            {useFahrenheit ? `${weather.windSpeedMph} mph` : `${weather.windSpeedKmh} km/h`}
          </div>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-bold">Precipitation</span>
          <div className="font-extrabold text-slate-800 dark:text-slate-200 font-mono-numbers mt-0.5">
            {weather.precipitationChance}%
          </div>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-bold">UV Index</span>
          <div className="font-extrabold text-slate-800 dark:text-slate-200 font-mono-numbers mt-0.5">
            {weather.uvIndex} (Low)
          </div>
        </div>
      </div>

      {/* Runner Condition Advice & Gear Tip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="flex-1">
          <span className="font-bold text-blue-600 dark:text-blue-400">Coach Weather Note: </span>
          <span className="text-slate-600 dark:text-slate-300">{weather.runningSuitability.advice}</span>
          <span className="block sm:inline sm:ml-2 text-slate-400">
            · <strong className="text-slate-500 dark:text-slate-400">Suggested Gear:</strong> {weather.runningSuitability.gearTip}
          </span>
        </div>
      </div>

    </div>
  );
};
