'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import TVNLogo from '../TVN-logo.png';

export default function DeleteChannelPage() {
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleDelete = async (channelID) => {
    const confirmDelete = confirm('Are you sure you want to delete this channel?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`${apiUrl}/channels/${channelID}/`);
      fetchChannels(); // refresh list after deletion
    } catch (err) {
      alert('Error deleting channel: ' + err.message);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  return (
    <main className="p-6 bg-white text-black dark:bg-gray-900 dark:text-white min-h-screen">
      <div className="flex items-center justify-between mb-6 relative">
        {/* Left: Profiles heading */}
        <h1 className="text-2xl font-bold text-black dark:text-white">Delete Channels</h1>

        {/* Center: Logo */}
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer"
          onClick={() => window.location.href = '/'}
        >
          <Image src={TVNLogo} alt="TVN Logo" width={90} height={90} priority />
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Delete</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.id}>
                <td className="border px-4 py-2 text-center">{channel.id}</td>
                <td className="border px-4 py-2 text-center">{channel.name}</td>
                <td className="border px-4 py-2 text-center">{channel.status}</td>
                <td className="border px-4 py-2 text-center">
                  {channel.status === 'running' ? (
                    <button
                      className="bg-gray-400 text-white px-3 py-1 rounded cursor-not-allowed"
                      onClick={()=>alert('Stop the channel before deleting')}
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDelete(channel.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-800"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
