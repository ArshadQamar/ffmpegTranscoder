'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';


export default function CreateChannel() {
  // Environment variables
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;
  
  // for page routing
  const router = useRouter();

  // Channel Details
  const [name, setName] = useState('');
  const [inputType, setInputType] = useState('');
  const [input, setInput] = useState('')
  const [outputType, setOutputType] = useState('');
  const [output, setOutput] = useState('')
  const [network, setNetwork] = useState([])
  const [selectedInputNetwork, setSelectedInputNetwork] = useState('');
  const [selectedOutputNetwork, setSelectedOutputNetwork] = useState('');

  // Transcoding Param
  const [videoCodec, setVideoCodec] = useState('');
  const [audioCodec, setAudioCodec] = useState('');
  const [audioGain, setAudioGain] = useState('');
  const [videoBitrate, setVideoBitrate] = useState('');
  const [audioBitrate, setAudioBitrate] = useState('');
  const [bufferSize, setBufferSize] = useState('');
  const [resolution, setResolution] = useState('');
  const [frameRate, setFrameRate] = useState('');
  const [logoPath, setLogoPath] = useState('');
  const [logoPosition, setLogoPosition] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [videoPid, setVideoPid] = useState('');
  const [audioPid, setAudioPid] = useState('');
  const [scanType, setScanType] = useState('')
  

  useEffect(() => {
    // Fetch network interfaces from API
    axios.get(`${apiUrl}/netiface`)
      .then(response => {
        setNetwork(response.data); // Set the fetched network interfaces in state
        console.log(response.data)
      })
      .catch(error => {
        console.error('Error fetching network interfaces:', error);
      });
  }, []);

  //Handling submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('submit clicked')
    
    const payload = {
      name,
      input_type: inputType,
      input_url: inputType === 'hls' ? input: null,
      input_multicast_ip: inputType === 'udp' ? input: null,
      input_network: inputType === 'udp' ? selectedInputNetwork: null,
      input_file: inputType === 'file' ? input : null,

      output_type: outputType,
      output_url: outputType === 'hls' ? output : null,
      output_multicast_ip: outputType === 'udp' ? output : null,
      output_network: outputType === 'udp' ? selectedOutputNetwork : null,
      output_file: outputType === 'file' ? output : null,      

      video_codec: videoCodec,
      audio: audioCodec,
      audio_gain: parseFloat(audioGain) || 1.0,
      video_bitrate: parseInt(videoBitrate) || 0,
      audio_bitrate: parseInt(audioBitrate) || 0,
      buffer_size: parseInt(bufferSize) || 0,
      service_id: parseInt(serviceId),
      audio_pid: parseInt(audioPid),
      video_pid: parseInt(videoPid),
      resolution,
      scan_type: scanType,
      frame_rate: parseInt(frameRate) || 0,

      logo_path: logoPath || null,
      logo_position: logoPosition || null,
    };

    try{
      const response = await axios.post(`${apiUrl}/channels/`, payload);
      console.log(response.data)
      if(response.status === 201 || response.status === 200){
        alert(`channel created succesfully`);
        router.push('/')
      }else{
        alert(`unexpected response ${responsestatus}`);
      }

    }catch(error){
      alert(`Failed to create channel. Error: ${error.response?.data?.detail || error.message}`);
    }
    
    
  }


  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📺 Create New Channel</h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Channel Name */}
        <div>
          <label className="block font-semibold mb-1">Channel Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter channel name"
          />
        </div>

        {/* Input Type */}
        <div>
          <label className="block font-semibold mb-1">Input Type:</label>
          <select
            value={inputType}
            onChange={(e) => setInputType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select Input Type --</option>
            <option value="hls">HLS</option>
            <option value="udp">UDP</option>
            <option value="file">File</option>
          </select>
        </div>

        {/* Placeholder for conditional input fields */}
        <div className="mt-4">
          {inputType === 'hls' && (
            <div>
              <label className="block font-semibold mb-1">Input URL:</label>
              <input
                value={input}
                type="text"
                className="w-full p-2 border rounded"
                placeholder="http://example.com/stream.m3u8"
                onChange={(e)=>setInput(e.target.value)}
              />
            </div>
          )}

          {inputType === 'udp' && (
            <div>
              <label className="block font-semibold mb-1">Multicast IP:</label>
              <input
                value={input}
                type="text"
                className="w-full p-2 border rounded"
                placeholder="239.0.0.1:5000"
                onChange={(e)=>setInput(e.target.value)}

              />
              <label className="block font-semibold mb-1">Network Interface:</label>
              <select
                value={selectedInputNetwork}
                onChange={(e) => setSelectedInputNetwork(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select Network Interface --</option>
                {network.map((iface, index) => (
                  <option key={index} value={iface.ip_addresses}>
                    {iface.name} {iface.ip_addresses}
                  </option>
                ))}
              </select>
            </div>
          )}

          {inputType === 'file' && (
            <div>
              
              <label className="block font-semibold mb-1">Upload File:</label>
              <input 
              value={input}
              type="text" 
              className="w-full p-2 border rounded" 
              onChange={(e)=>setInput(e.target.value)}
              placeholder='/file/path/video.mp4'
              />
            </div>
          )}
        </div>
        {/* Output Type */}
        <div className="mt-6">
          <label className="block font-semibold mb-1">Output Type:</label>
          <select
            value={outputType}
            onChange={(e) => setOutputType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select Output Type --</option>
            <option value="hls">HLS</option>
            <option value="udp">UDP</option>
            <option value="file">File</option>
          </select>
        </div>

        {/* Output Fields */}
        {outputType === 'udp' && (
          <div className="mt-4">
            <label className="block font-semibold mb-1">Output Multicast IP:</label>
            <input
              value={output}
              type="text"
              className="w-full p-2 border rounded"
              placeholder="239.0.0.2:6000"
              onChange={(e)=>setOutput(e.target.value)}
            />
            <label className="block font-semibold mb-1 mt-2">Output Network Interface:</label>
            <select
              value={selectedOutputNetwork}
              onChange={(e) => setSelectedOutputNetwork(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Network Interface --</option>
              {network.map((iface, index) => (
                <option key={index} value={iface.ip_addresses}>
                  {iface.name} {iface.ip_addresses}
                </option>
              ))}
            </select>
          </div>
        )}
          {outputType === 'hls' && (
            <div>
              <label className="block font-semibold mb-1">Input URL:</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="http://example.com/stream.m3u8"
                onChange={(e)=>setOutput(e.target.value)}
              />
            </div>
          )}

          {outputType === 'file' && (
            <div>
              <label className="block font-semibold mb-1">Upload File:</label>
              <input 
              type="text" 
              className="w-full p-2 border rounded"
              onChange={(e)=>setOutput(e.target.value)}
              placeholder='/file/path/name.mp4'
              />
            </div>
          )}

        {/* Transcoding Parameters */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">🎛️ Transcoding Parameters</h2>

          {/* Video Codec */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Video Codec:</label>
            <select
              value={videoCodec}
              onChange={(e) => setVideoCodec(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Video Codec --</option>
              <option value="h264">H.264</option>
              <option value="h265">H.265</option>
              <option value="mpeg2">MPEG-2</option>
            </select>
          </div>

          {/* Audio Codec */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Audio Codec:</label>
            <select
              value={audioCodec}
              onChange={(e) => setAudioCodec(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Audio Codec --</option>
              <option value="aac">AAC</option>
              <option value="ac3">AC3</option>
              <option value="mp2">MP2</option>
            </select>
          </div>

          {/* Audio Gain */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Audio Gain:</label>
            <input
              type="number"
              step="0.1"
              value={audioGain}
              onChange={(e) => setAudioGain(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g. 1.0, 0.1(-90)"
            />
          </div>

          {/* Video Bitrate */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Video Bitrate (bps):</label>
            <input
              type="number"
              value={videoBitrate}
              onChange={(e) => setVideoBitrate(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g. 2400000"
            />
          </div>

          {/* Audio Bitrate */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Audio Bitrate (bps):</label>
            <input
              type="number"
              value={audioBitrate}
              onChange={(e) => setAudioBitrate(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g. 128000"
            />
          </div>

          {/* Buffer Size */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Buffer Size (bits):</label>
            <input
              type="number"
              value={bufferSize}
              onChange={(e) => setBufferSize(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g. 4800000"
            />
          </div>

          {/* Service ID */}
          <div className='mb-4'>
            <label className="block font-semibold mb-1">SID</label>
            <input
              type="number"
              value={serviceId}
              onChange={(e)=>setServiceId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder='(1-9999)'
            />
          </div>
          {/* Video PID */}
          <div className='mb-4'>
            <label className="block font-semibold mb-1">Video PID</label>
            <input
              type="number"
              value={videoPid}
              onChange={(e)=>setVideoPid(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder='(1-9999)'
            />
          </div>
          {/* Audio PID */}
          <div className='mb-4'>
            <label className="block font-semibold mb-1">Audio PID</label>
            <input
              type="number"
              value={audioPid}
              onChange={(e)=>setAudioPid(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder='(1-9999)'
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Scan Type:</label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Scan type --</option>
              <option value="progressive">Progressive</option>
              <option value="interlaced">Interlaced</option>
            </select>
          </div>

          {/* Resolution */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Resolution:</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Resolution --</option>
              <option value="1920x1080">1920x1080</option>
              <option value="1280x720">1280x720</option>
              <option value="1024x576">1024x576</option>
              <option value="768x576">768x576</option>
              <option value="854x480">854x480</option>
              <option value="640x360">640x360</option>
              <option value="426x240">426x240</option>
            </select>
          </div>

          {/* Frame Rate */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Frame Rate (fps):</label>
            <select
              value={frameRate}
              onChange={(e) => setFrameRate(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Frame Rate --</option>
              <option value="24">24</option>
              <option value="25">25</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="60">60</option>
            </select>
          </div>

          {/* Logo Overlay */}
          <h2 className="text-xl font-semibold mb-4 mt-8">🖼️ Logo Overlay</h2>

          {/* Logo Path */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Logo Path:</label>
            <input
              type="text"
              value={logoPath}
              onChange={(e) => setLogoPath(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g. /logos/channel-logo.png"
            />
          </div>

          {/* Logo Position */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Logo Position:</label>
            <select
              value={logoPosition}
              onChange={(e) => setLogoPosition(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Position --</option>
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded mt-6"
        >
          Create Channel
        </button>
      </form>
    </main>
  );
}