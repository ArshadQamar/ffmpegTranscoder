'use client';
import { useEffect, useState } from "react";
import axios from "axios";

export default function Profiles(){
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null)

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
    
// Render states

return (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Profiles</h1>
    {loading ? (
      <p className="text-gray-500">Loading channels...</p>
    ) : error ? (
      <p className="text-red-500">{error}</p>
    ) : channels.length === 0 ? (
      <p className="text-gray-500">No channels found.</p>
    ) : (
      <ul className="space-y-2">
        {channels.map((ch) => (
          <li
            key={ch.id}
            className="p-4 bg-white shadow rounded-md flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{ch.name}</p>
              <p className="text-sm text-gray-500">
                Input: {ch.input_multicast_ip} | 
                Codec: {ch.video_codec} | 
                Bitrate: {ch.video_bitrate} | 
                Output: {ch.output_multicast_ip}
              </p>
            </div>
            <button
              onClick={() => handleDownload(ch)}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Download JSON
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
)};
