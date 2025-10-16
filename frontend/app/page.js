'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TVNLogo from './TVN-logo.png';
import axios from 'axios';

export default function Dashboard() {
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;

  // State
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState({});
  const [stopping, setStopping] = useState({});
  const [metrics, setMetrics] = useState({});
  const router = useRouter();

  // Fetch channel list
  useEffect(() => {
    axios.get(`${apiUrl}/channels/`)
      .then(response => {
        setChannels(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch channels. Check backend service.');
        setLoading(false);
      });
  }, []);

  // Fetch metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get(`${apiUrl}/metrics/`);
        setMetrics(response.data);
      } catch (error) {
        console.error("Failed to fetch metrics", error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle start
  const handleStart = async (jobID) => {
    setStarting(prev => ({ ...prev, [jobID]: true }));
    try {
      await axios.post(`${apiUrl}/job/${jobID}/start/`);
      const response = await axios.get(`${apiUrl}/channels`);
      setChannels(response.data);

      let attempt = 0;
      const maxAttempt = 10;

      const pollUntilRunning = async () => {
        while (attempt < maxAttempt) {
          const response = await axios.get(`${apiUrl}/channels`);
          const updated = response.data.find(ch => ch.job_id === jobID);

          if (updated?.status === 'running' || updated?.status === 'error') {
            setChannels(response.data);
            setStarting(prev => ({ ...prev, [jobID]: false }));
            if (updated?.status === 'error' && updated?.error_message){
              alert(`Error: ${updated.error_message}`);
            }
            return;
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
          attempt++;
        }
        const finalResponse = await axios.get(`${apiUrl}/channels`);
        setChannels(finalResponse.data);
        const updated = finalResponse.data.find(ch => ch.job_id === jobID);
        if (updated?.status === 'running' || updated?.status === 'error') {
          setStarting(prev => ({ ...prev, [jobID]: false }));

          if (updated?.status === 'error' && updated?.error_message){
            alert(`Error: ${updated.error_message}`);
          }
        }

      };
      await pollUntilRunning();
    } catch (error) {
      setStarting(prev => ({ ...prev, [jobID]: false }));
      alert('Error starting job:', error);
    }
  };

  // Handle stop
  const handleStop = async (jobID) => {
    setStopping(prev => ({ ...prev, [jobID]: true }));
    try {
      await axios.post(`${apiUrl}/job/${jobID}/stop/`);
      const response = await axios.get(`${apiUrl}/channels`);
      setChannels(response.data);
      
      let attempt = 0;
      const maxAttempt = 10;

      const pollUntilStopped = async () => {
        while (attempt < maxAttempt) {
          const response = await axios.get(`${apiUrl}/channels`);
          const updated = response.data.find(ch => ch.job_id === jobID);

          if (updated?.status === 'stopped' || updated?.status === 'error') {
            setChannels(response.data);
            setStopping(prev => ({ ...prev, [jobID]: false }));
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempt++;
        }
        const finalResponse = await axios.get(`${apiUrl}/channels`);
        setChannels(finalResponse.data);
        setStopping(prev => ({ ...prev, [jobID]: false }));
      };
      await pollUntilStopped();
    } catch {
      setStopping(prev => ({ ...prev, [jobID]: false }));
      alert('Error stopping job');
    }
  };

  // Calculate stats
  const runningChannels = channels.filter(ch => ch.status === 'running').length;
  const totalChannels = channels.length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 p-4 sm:p-6">
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-200 dark:bg-indigo-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header Section - Removed card styling */}
      <div className="max-w-7xl mx-auto mb-8 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Channel Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Monitor and manage your streaming channels
              </p>
            </div>
          </div>

          {/* Centered TVN Logo */}
          <div className="flex-1 flex justify-center">
            <div 
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => router.push('/')}
            >
              <Image src={TVNLogo} alt="TVN Logo" width={100} height={100} priority />
            </div>
          </div>

          {/* Quick Stats - Removed card styling */}
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalChannels}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Channels</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{runningChannels}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* CPU Metric */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50 hover:transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">CPU Usage</h3>
              <div className={`w-3 h-3 rounded-full ${
                (metrics.cpu_usage || 0) <= 70 ? "bg-green-500" : 
                (metrics.cpu_usage || 0) <= 85 ? "bg-yellow-500" : 
                "bg-red-500"
              }`}></div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {metrics.cpu_usage || 0}%
            </div>
            <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  (metrics.cpu_usage || 0) <= 70 ? "bg-gradient-to-r from-green-500 to-green-600" : 
                  (metrics.cpu_usage || 0) <= 85 ? "bg-gradient-to-r from-yellow-500 to-yellow-600" : 
                  "bg-gradient-to-r from-red-500 to-red-600"
                }`}
                style={{ width: `${metrics.cpu_usage || 0}%` }}
              ></div>
            </div>
          </div>

          {/* RAM Metric */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50 hover:transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">RAM Usage</h3>
              <div className={`w-3 h-3 rounded-full ${
                (metrics.ram_usage || 0) <= 70 ? "bg-green-500" : 
                (metrics.ram_usage || 0) <= 85 ? "bg-yellow-500" : 
                "bg-red-500"
              }`}></div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {metrics.ram_usage || 0}%
            </div>
            <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  (metrics.ram_usage || 0) <= 70 ? "bg-gradient-to-r from-green-500 to-green-600" : 
                  (metrics.ram_usage || 0) <= 85 ? "bg-gradient-to-r from-yellow-500 to-yellow-600" : 
                  "bg-gradient-to-r from-red-500 to-red-600"
                }`}
                style={{ width: `${metrics.ram_usage || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Network In */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50 hover:transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">Network In</h3>
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {(metrics.network?.in_mbps || 0).toFixed(1)}
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400"> Mb/s</span>
            </div>
            <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                style={{ width: `${Math.min((metrics.network?.in_mbps || 0) * 2, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Network Out */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50 hover:transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">Network Out</h3>
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"></div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {(metrics.network?.out_mbps || 0).toFixed(1)}
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400"> Mb/s</span>
            </div>
            <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
                style={{ width: `${Math.min((metrics.network?.out_mbps || 0) * 2, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button 
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 font-medium flex items-center gap-2 backdrop-blur-sm border border-white/20"
            onClick={() => router.push('/addChannel')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Channel
          </button>
          <button 
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 font-medium flex items-center gap-2 backdrop-blur-sm border border-white/20"
            onClick={() => router.push('/profiles')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profiles
          </button>
          <button 
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 font-medium flex items-center gap-2 backdrop-blur-sm border border-white/20"
            onClick={() => router.push('/deleteChannel')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Channels
          </button>
        </div>
      </div>

      {/* Channels Table */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-300/70 dark:border-gray-600/70">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Channels</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your streaming channels</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-2">⚠️ {error}</div>
              <p className="text-gray-600 dark:text-gray-400">Please check your backend connection</p>
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📺</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No channels found</h3>
              <p className="text-gray-600 dark:text-gray-400">Get started by creating your first channel</p>
              <button 
                className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg transition-colors backdrop-blur-sm border border-white/20"
                onClick={() => router.push('/addChannel')}
              >
                Create Channel
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/50 dark:bg-gray-700/50 border-b border-gray-300/70 dark:border-gray-600/70">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Channel</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Input Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Modify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300/50 dark:divide-gray-600/50">
                  {channels.map((channel, index) => (
                    <tr 
                      key={channel.id} 
                      className={`
                        transition-colors duration-200
                        ${channel.status === 'running' 
                          ? 'bg-green-300/80 dark:bg-green-900/40 border-l-4 border-l-green-500' 
                          : index % 2 === 0 
                            ? 'bg-white/30 dark:bg-gray-800/30' 
                            : 'bg-white/10 dark:bg-gray-800/10'
                        }
                        hover:bg-white/50 dark:hover:bg-gray-700/30
                      `}
                    >
                      <td className="px-6 py-4 border-r border-gray-300/50 dark:border-gray-600/50">
                        <div>
                          <div className={`font-medium ${channel.status === 'running' ? 'text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-white'}`}>
                            {channel.name}
                          </div>
                          <div className={`text-sm ${channel.status === 'running' ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}>
                            ID: {channel.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-300/50 dark:border-gray-600/50">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm ${
                          channel.status === 'running'
                            ? 'bg-green-200/80 dark:bg-green-800/80 text-green-800 dark:text-green-200'
                            : 'bg-blue-100/80 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200'
                        }`}>
                          {channel.input_type?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-300/50 dark:border-gray-600/50">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            channel.status === 'running' ? 'bg-green-500' :
                            channel.status === 'pending' ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`}></div>
                          <span className={`font-medium ${
                            channel.status === 'running' ? 'text-green-700 dark:text-green-300' :
                            channel.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-gray-600 dark:text-gray-400'
                          }`}>
                            {channel.status?.charAt(0).toUpperCase() + channel.status?.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-r border-gray-300/50 dark:border-gray-600/50">
                        {channel.status === "running" ? (
                          <button 
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-200 flex items-center gap-2 mx-auto backdrop-blur-sm border border-white/20"
                            onClick={() => handleStop(channel.job_id)}
                            disabled={stopping[channel.job_id]}
                          >
                            {stopping[channel.job_id] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Stopping...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                </svg>
                                Stop
                              </>
                            )}
                          </button>
                        ) : (
                          <button 
                            className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-200 flex items-center gap-2 mx-auto backdrop-blur-sm border border-white/20 ${
                              (channel.status === "pending" || starting[channel.job_id]) 
                                ? "bg-gray-400 cursor-not-allowed text-white" 
                                : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                            }`}
                            onClick={() => handleStart(channel.job_id)}
                            disabled={channel.status === "pending" || starting[channel.job_id]}
                          >
                            {starting[channel.job_id] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Starting...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Start
                              </>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-200 flex items-center gap-2 mx-auto backdrop-blur-sm border border-white/20 ${
                            channel.status === 'running'
                              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                          }`}
                          onClick={() => {
                            if (channel.status === 'running') {
                              alert('Please stop the channel before editing');
                            } else {
                              router.push(`/editChannel/${channel.id}`);
                            }
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}