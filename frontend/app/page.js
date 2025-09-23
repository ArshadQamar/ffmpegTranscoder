'use client'; // Enables client-side interactivity
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
    try {
      await axios.post(`${apiUrl}/job/${jobID}/stop/`);
      const response = await axios.get(`${apiUrl}/channels`);
      setChannels(response.data);
    } catch {
      alert('Error stopping job');
    }
  };

  return (
    <main className="p-6 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl shadow mb-6">
        
        {/* Metrics */}
        <div className="flex items-end gap-6">
          {/* CPU */}
          <div className="flex flex-col items-center relative group">
            <div className="relative w-6 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-end overflow-visible">
              <div 
                className="bg-green-500 w-full rounded-b"
                style={{ height: `${metrics.cpu_usage || 0}%` }}
              ></div>
              {/* Tooltip */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {metrics.cpu_usage || 0}%
              </div>
            </div>
            <span className="mt-2 text-xs font-medium">CPU</span>
          </div>

          {/* RAM */}
          <div className="flex flex-col items-center relative group">
            <div className="relative w-6 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-end overflow-visible">
              <div 
                className="bg-blue-500 w-full rounded-b"
                style={{ height: `${metrics.ram_usage || 0}%` }}
              ></div>
              {/* Tooltip */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {metrics.ram_usage || 0}%
              </div>
            </div>
            <span className="mt-2 text-xs font-medium">RAM</span>
          </div>
        </div>

        {/* Logo */}
        <div className="flex-1 flex justify-center">
          <div className="cursor-pointer" onClick={() => router.push('/')}> 
            <Image src={TVNLogo} alt="TVN Logo" width={120} height={120} priority />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg shadow"
            onClick={() => router.push('/addChannel')}>
            + Channel
          </button>
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg shadow"
            onClick={() => router.push('/profiles')}>
            Profiles
          </button>
          <button 
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg shadow"
            onClick={() => router.push('/deleteChannel')}>
            Delete
          </button>
        </div>
      </div>

      {/* Channels Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow p-4">
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200">
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Input Type</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-center">Action</th>
                <th className="px-4 py-2 text-center">Modify</th>
              </tr>
            </thead>
            <tbody>
              {channels.map(channel => (
                <tr key={channel.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2">{channel.id}</td>
                  <td className="px-4 py-2">{channel.name}</td>
                  <td className="px-4 py-2">{channel.input_type}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium 
                      ${channel.status === 'running' ? 'bg-green-100 text-green-600' : 
                        channel.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 
                        'bg-gray-200 text-gray-600'}`}>
                      {channel.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {channel.status === "running" ? (
                      <button 
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm shadow"
                        onClick={() => handleStop(channel.job_id)}>
                        Stop
                      </button>
                    ) : (
                      <button 
                        className={`px-3 py-1 rounded-lg text-sm shadow text-white 
                          ${(channel.status === "pending" || starting[channel.job_id]) 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-green-500 hover:bg-green-600"}`}
                        onClick={() => handleStart(channel.job_id)}
                        disabled={channel.status === "pending" || starting[channel.job_id]}>
                        Start
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button 
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm shadow"
                      onClick={() => {
                        if (channel.status === 'running') {
                          alert('Stop the channel before editing');
                        } else {
                          router.push(`/editChannel/${channel.id}`);
                        }
                      }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
