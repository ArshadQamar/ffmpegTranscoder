'use client'; // Enables client-side interactivity
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TVNLogo from './TVN-logo.png';
import axios from 'axios';
import { resolve } from 'styled-jsx/css';

export default function Dashboard() {
 // Environment variable
 const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;


  // State to hold channels
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState({}); // jobID: boolean
  const router = useRouter(); // initialize router


  // Fetch channel list from API on component mount
  useEffect(() => {
    axios.get(`${apiUrl}/channels/`)
      .then(response => {
        setChannels(response.data); // Store data in state
        setLoading(false);          // Stop loading spinner
      })
      .catch(error => {
        console.error('Error fetching channels:', error);
        setError('Failed to fetch channels check backend service');
        setLoading(false);
      });
  }, []);

  // Handle start
  const handleStart = async (jobID) => {
    setStarting(prev => ({ ...prev, [jobID]: true }));
    console.log(`starting channel with id ${jobID}`);
    try {
      // start the job
      await axios.post(`${apiUrl}/job/${jobID}/start/`);

      // Refetch Updated channel from backend
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
          attempt += 1;
        }
        // Final fetch
        const finalResponse = await axios.get(`${apiUrl}/channels`);
        setChannels(finalResponse.data);
        // Check if error or running after polling
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
  //Handle stop
  const handleStop = async (jobID)=>{
    try{
      //stop the job
      await axios.post(`${apiUrl}/job/${jobID}/stop/`)

      //refetch the status
      const response = await axios.get(`${apiUrl}/channels`)

      //UI re-render
      setChannels(response.data)
    }catch(error){
      alert('Error stopping job', error)
    }
  }

  return (
  <main className="p-6 bg-white text-black dark:bg-gray-900 dark:text-white min-h-screen">
      <div className="flex justify-between items-center mb-4 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 p-4 rounded">
        <h1 className="text-xl font-bold text-black dark:text-white">Channel Dashboard</h1>
        <div className="flex-1 flex justify-center">
          <div className="cursor-pointer w-fit" onClick={() => router.push('/')}> 
            <Image src={TVNLogo} alt="TVN Logo" width={100} height={100} priority />
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            className="bg-orange-400 text-white px-2 py-1 rounded hover:bg-green-700"
            onClick={() => router.push('/addChannel')}>
            + Channel
          </button>
          <button 
            className="bg-blue-400 text-white px-2 py-1 rounded hover:bg-gray-700"
            onClick={() => router.push('/profiles')}>
            Profiles
          </button>
          <button 
            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700"
            onClick={() => router.push('/deleteChannel')}>
            Delete Channel
          </button>
        </div>
      </div>

      {/* Show loading state */}
      {loading ? <p>Loading...</p> : 
      error ? <p className="text-red-500">Error: {error}</p> :(
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-black dark:text-white">ID</th>
              <th className="border border-gray-300 px-4 py-2 text-black dark:text-white">Name</th>
              <th className="border border-gray-300 px-4 py-2 text-black dark:text-white">Input Type</th>
              <th className="border border-gray-300 px-4 py-2 text-black dark:text-white">Status</th>
              <th className="border border-gray-300 px-4 py-2 text-black dark:text-white">Action</th>
              <th className="border border-gray-300 px-4 py-2 text-black dark:text-white">Modify</th>
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
                    channel.status == "running" ? (
                      <button className="bg-red-500 text-white py-1 px-3 rounded hover:bg-green-500"
                        onClick={() => handleStop(channel.job_id)}
                      > Stop
                      </button>
                    ) : <button className={`py-1 px-3 rounded text-white 
                        ${(channel.status === "pending" || starting[channel.job_id])
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 hover:bg-red-500"
                        }`}
                        onClick={() => { handleStart(channel.job_id); }}
                        disabled={channel.status === "pending" || starting[channel.job_id]}>
                      Start
                    </button>
                  }
                </td>
                <td className="border border-gray-300 px-4 py-1 text-center align-middle">
                  <button className='bg-blue-500 py-1 px-3 rounded hover:bg-blue-700'
                   onClick={()=>{if(channel.status == 'running'){
                   alert('Stop the channel before editing')
                   }else{router.push(`/editChannel/${channel.id}`);}}}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
