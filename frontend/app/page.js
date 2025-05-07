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

  // Handle start
  const handleStart = (channelId) =>{
    console.log(`starting channel with id ${channelId}`)

  }
  //Handle stop
  const handleStop = (channelId) =>{
    console.log(`stopping channel with id ${channelId}`);
    
  }

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">📡 Channel Dashboard</h1>
        <button className="bg-orange-400 text-white px-2 py-1 rounded hover:bg-green-700">
          + Channel
        </button>
      </div>
      {/* Show loading state */}
      {loading ? null : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">ID</th>
              <th className="border border-gray-300 px-4 py-2">Name</th>
              <th className="border border-gray-300 px-4 py-2">Input Type</th>
              <th className="border border-gray-300 px-4 py-2">Status</th>
              <th className="border border-gray-300 px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {channels.map(channel => (
              <tr key={channel.id}>
                <td className="border border-gray-300 px-4 py-1 text-center align-middle">{channel.id}</td>
                <td className="border border-gray-300 px-4 py-1 text-center align-middle">{channel.name}</td>
                <td className="border border-gray-300 px-4 py-1 text-center align-middle">{channel.input_type}</td>
                <td className="border border-gray-300 px-4 py-1 text-center align-middle">{channel.status}</td>
                <td className="border border-gray-300 px-4 py-1 text-center align-middle">
                  {
                    channel.status == "running" ?(
                      <button className="bg-red-500 text-white py-1 px-3 rounded hover:bg-green-500"
                      onClick={()=>handleStop(channel.id)}
                      > Stop
                      </button>
                    ): <button className="bg-green-500 text-white py-1 px-3 rounded hover:bg-red-500"
                    onClick={()=>{handleStart(channel.id)}}>
                      Start
                    </button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
