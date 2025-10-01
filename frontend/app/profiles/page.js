'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import Image from 'next/image';
import TVNLogo from '../TVN-logo.png';
import { useRouter } from 'next/navigation';

export default function Profiles(){
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(()=>{
        axios.get(`${apiUrl}/channels/`)
        .then((res)=>{
            setChannels(res.data)
            setLoading(false)
        })
        .catch((err)=>{
            console.error('failed to fetch channels', err);
            setLoading(false)
            setError('Failed to fetch channels check backend service')            
        });
    }, [])

    const handleDownload = (channel)=>{
      const jsonstr = JSON.stringify(channel, null, 2);
      const blob = new Blob([jsonstr],{type: "application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${channel.name || "channel"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 p-4 sm:p-6">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-green-200 dark:bg-green-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
        </div>

        {/* Header Section */}
        <div className="max-w-6xl mx-auto mb-8 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Channel Profiles</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Export channel configurations as JSON files
                </p>
              </div>
            </div>

            {/* Centered TVN Logo */}
            <div className="flex-1 flex justify-center">
              <div 
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => router.push('/')}
              >
                <Image src={TVNLogo} alt="TVN Logo" width={80} height={80} priority />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{channels.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Profiles</div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="flex justify-start mb-6">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Profiles Content */}
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/20 dark:border-gray-700/50">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Available Profiles</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {channels.length} profile{channels.length !== 1 ? 's' : ''} available for export
              </p>
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
                <div className="text-gray-400 text-6xl mb-4">📁</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No profiles found</h3>
                <p className="text-gray-600 dark:text-gray-400">Create channels to generate profiles</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {channels.map((channel) => (
                    <div 
                      key={channel.id}
                      className="bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-700/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40 dark:border-gray-600/40 hover:shadow-xl hover:transform hover:scale-105 transition-all duration-300 group"
                    >
                      {/* Channel Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/60 dark:to-blue-800/60 rounded-lg flex items-center justify-center">
                            <span className="text-lg">📺</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {channel.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">ID: {channel.id}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          channel.status === 'running' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          channel.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300'
                        }`}>
                          {channel.status?.charAt(0).toUpperCase() + channel.status?.slice(1)}
                        </span>
                      </div>

                      {/* Channel Details */}
                      <div className="space-y-3 mb-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 block">Input IP</span>
                            <span className="font-mono text-gray-900 dark:text-white">{channel.input_multicast_ip || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 block">Output IP</span>
                            <span className="font-mono text-gray-900 dark:text-white">{channel.output_multicast_ip || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 block">Codec</span>
                            <span className="text-gray-900 dark:text-white">{channel.video_codec || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 block">Bitrate</span>
                            <span className="text-gray-900 dark:text-white">{channel.video_bitrate || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleDownload(channel)}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm border border-white/20 hover:shadow-blue-500/25 hover:scale-105 group/btn"
                      >
                        <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download JSON Profile
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Information Card */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-5 h-5 text-blue-500 mt-0.5">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">About Profiles</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Each profile contains the complete channel configuration including input/output settings, 
                  codec parameters, and streaming details. Download these JSON files for backup or to 
                  replicate channels across different instances.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
};