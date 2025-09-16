'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

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
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">Delete Channels</h1>

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
