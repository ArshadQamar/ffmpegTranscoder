'use client'; // Enables client-side interactivity

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Dashboard() {
  // State to hold channels
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch channel list from API on component mount
  useEffect(() => {
    axios.get('http://localhost:8000/api/channels/')
      .then(response => {
        setChannels(response.data); // Store data in state
        setLoading(false);          // Stop loading spinner
      })
      .catch(error => {
        console.error('Error fetching channels:', error);
        setLoading(false);
      });
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">📡 Channel Dashboard</h1>

      {/* Show loading state */}
      {loading ? (
        <p>Loading channels...</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">ID</th>
              <th className="border border-gray-300 px-4 py-2">Name</th>
              <th className="border border-gray-300 px-4 py-2">Input Type</th>
              <th className="border border-gray-300 px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {channels.map(channel => (
              <tr key={channel.id}>
                <td className="border border-gray-300 px-4 py-2">{channel.id}</td>
                <td className="border border-gray-300 px-4 py-2">{channel.name}</td>
                <td className="border border-gray-300 px-4 py-2">{channel.input_type}</td>
                <td className="border border-gray-300 px-4 py-2">{channel.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
