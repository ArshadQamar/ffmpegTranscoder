'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import TVNLogo from '../TVN-logo.png';
import { useRouter } from 'next/navigation';

export default function DeleteChannelPage() {
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState({});
  const router = useRouter();

  const fetchChannels = async () => {
    try {
      const res = await axios.get(`${apiUrl}/channels/`);
      setChannels(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load channels');
      setLoading(false);
    }
  };

  const handleDelete = async (channelID, channelName) => {
    const confirmDelete = confirm(`Are you sure you want to delete "${channelName}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    setDeleting(prev => ({ ...prev, [channelID]: true }));
    try {
      await axios.delete(`${apiUrl}/channels/${channelID}/`);
      await fetchChannels(); // refresh list after deletion
    } catch (err) {
      alert('Error deleting channel: ' + err.message);
    } finally {
      setDeleting(prev => ({ ...prev, [channelID]: false }));
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 p-4 sm:p-6">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-red-200 dark:bg-red-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-8 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Delete Channels</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Remove channels from your streaming setup
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
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Channels</div>
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

      {/* Channels Table */}
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20 dark:border-gray-700/50">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Channel List</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {channels.length} channel{channels.length !== 1 ? 's' : ''} available
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
              <p className="text-gray-600 dark:text-gray-400">All channels have been deleted</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50/50 to-red-50/50 dark:from-gray-700/30 dark:to-red-900/20 border-b-2 border-gradient-to-r from-gray-200 to-red-200 dark:from-gray-600 dark:to-red-700">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Channel</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                  {channels.map((channel, index) => (
                    <tr 
                      key={channel.id} 
                      className={`
                        group transition-all duration-300 hover:bg-white/50 dark:hover:bg-gray-700/30
                        ${index % 2 === 0 ? 'bg-white/30 dark:bg-gray-800/30' : 'bg-white/10 dark:bg-gray-800/10'}
                      `}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center">
                            <span className="text-lg">📺</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{channel.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">ID: {channel.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            channel.status === 'running' ? 'bg-green-500 animate-pulse' :
                            channel.status === 'pending' ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`}></div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            channel.status === 'running' ? 'text-green-700 dark:text-green-300 bg-green-100/50 dark:bg-green-900/30' :
                            channel.status === 'pending' ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-100/50 dark:bg-yellow-900/30' :
                            'text-gray-600 dark:text-gray-400 bg-gray-100/50 dark:bg-gray-700/30'
                          }`}>
                            {channel.status?.charAt(0).toUpperCase() + channel.status?.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {channel.status === 'running' ? (
                          <button
                            className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl text-sm font-medium cursor-not-allowed transition-all duration-200"
                            onClick={() => alert('Please stop the channel before deleting')}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            Stop to Delete
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(channel.id, channel.name)}
                            disabled={deleting[channel.id]}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-medium shadow-lg transition-all duration-200 backdrop-blur-sm border border-white/20 hover:shadow-red-500/25 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleting[channel.id] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Channel
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Warning Message */}
        <div className="mt-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-5 h-5 text-orange-500 mt-0.5">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-orange-800 dark:text-orange-300">Important Notice</h4>
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                Channels must be stopped before deletion. Running channels cannot be deleted for safety reasons.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}