'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import TVNLogo from '../../TVN-logo.png';

export default function EditChannel() {
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;
  const params = useParams();
  const channelId = params?.id;
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Channel Details
  const [name, setName] = useState('');
  const [inputType, setInputType] = useState('');
  const [input, setInput] = useState('');
  const [outputType, setOutputType] = useState('');
  const [output, setOutput] = useState('');
  const [network, setNetwork] = useState([]);
  const [selectedInputNetwork, setSelectedInputNetwork] = useState('');
  const [selectedOutputNetwork, setSelectedOutputNetwork] = useState('');

  // Transcoding Param
  const [videoCodec, setVideoCodec] = useState('');
  const [audioCodec, setAudioCodec] = useState('');
  const [audioGain, setAudioGain] = useState('');
  const [bitrateMode, setBitrateMode] = useState('');
  const [videoBitrate, setVideoBitrate] = useState('');
  const [audioBitrate, setAudioBitrate] = useState('');
  const [bufferSize, setBufferSize] = useState('');
  const [resolution, setResolution] = useState('');
  const [frameRate, setFrameRate] = useState('');
  const [logoPath, setLogoPath] = useState('');
  const [logoPosition, setLogoPosition] = useState('');
  const [logoOpacity, setLogoOpacity] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [videoPid, setVideoPid] = useState('');
  const [audioPid, setAudioPid] = useState('');
  const [pmtPid, setPmtPid] = useState('');
  const [pcrPid, setPcrPid] = useState('');
  const [scanType, setScanType] = useState('');
  const [aspectRatio, setAspectRatio] = useState('');

  useEffect(() => {
    if (!channelId) return;

    // Fetch channel details
    axios.get(`${apiUrl}/channels/${channelId}/`)
      .then((res) => {
        const data = res.data;
        setName(data.name);
        setInputType(data.input_type);
        setOutputType(data.output_type);
        setInput(data.input_url || data.input_multicast_ip || data.input_file || '');
        setOutput(data.output_url || data.output_multicast_ip || data.output_file || '');
        setSelectedInputNetwork(data.input_network || '');
        setSelectedOutputNetwork(data.output_network || '');
        setVideoCodec(data.video_codec);
        setAudioCodec(data.audio);
        setAudioGain(data.audio_gain);
        setBitrateMode(data.bitrate_mode);
        setVideoBitrate(data.video_bitrate);
        setAudioBitrate(data.audio_bitrate);
        setBufferSize(data.buffer_size);
        setServiceId(data.service_id);
        setVideoPid(data.video_pid);
        setAudioPid(data.audio_pid);
        setPmtPid(data.pmt_pid || '');
        setPcrPid(data.pcr_pid || '');
        setResolution(data.resolution);
        setFrameRate(data.frame_rate);
        setLogoPath(data.logo_path || '');
        setLogoPosition(data.logo_position || '');
        setLogoOpacity(data.logo_opacity || '');
        setScanType(data.scan_type);
        setAspectRatio(data.aspect_ratio);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch channel details', err);
        setLoading(false);
      });

    // Fetch network interfaces
    axios.get(`${apiUrl}/netiface/`)
      .then((res) => setNetwork(res.data))
      .catch((err) => console.error('Failed to fetch network interfaces', err));
  }, [channelId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      status: "stopped",
      input_type: inputType,
      input_url: inputType === 'hls' ? input : null,
      input_multicast_ip: inputType === 'udp' ? input : null,
      input_network: inputType === 'udp' ? selectedInputNetwork : null,
      input_file: inputType === 'file' ? input : null,
      output_type: outputType,
      output_url: outputType === 'hls' ? output : null,
      output_multicast_ip: outputType === 'udp' ? output : null,
      output_network: outputType === 'udp' ? selectedOutputNetwork : null,
      output_file: outputType === 'file' ? output : null,
      video_codec: videoCodec,
      audio: audioCodec,
      audio_gain: parseFloat(audioGain) || 1.0,
      bitrate_mode: bitrateMode,
      video_bitrate: parseInt(videoBitrate) || 0,
      audio_bitrate: parseInt(audioBitrate) || 0,
      buffer_size: parseInt(bufferSize) || 0,
      service_id: parseInt(serviceId) || 1,
      audio_pid: parseInt(audioPid) || 102,
      video_pid: parseInt(videoPid) || 101,
      pmt_pid: parseInt(pmtPid),
      pcr_pid: parseInt(pcrPid),
      resolution,
      scan_type: scanType,
      aspect_ratio: aspectRatio,
      frame_rate: parseInt(frameRate) || 0,
      logo_path: logoPath || null,
      logo_position: logoPosition || null,
      logo_opacity: parseFloat(logoOpacity) || null,
    };

    try {
      console.log('Payload:', payload);
      const res = await axios.put(`${apiUrl}/channels/${channelId}/`, payload);
      if (res.status === 200) {
        alert('Channel updated successfully!');
        router.push('/');
      } else {
        alert(`Unexpected response: ${res.status}`);
      }
    } catch (error) {
      if (error.response?.data?.error) {
        const messages = error.response.data.error
          .map(err => `${err.fields}: ${err.message}`)
          .join('\n');
        alert(`Failed to create channel:\n${messages}`);
      } else {
        alert('Failed to create channel');
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <>
      {/* Header with Centered Logo */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Edit Channel Text on Left */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Channel</h1>
            </div>

            {/* Centered TVN Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div 
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => router.push('/')}
              >
                <Image src={TVNLogo} alt="TVN Logo" width={120} height={120} priority />
              </div>
            </div>

            {/* Empty div for balance */}
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="flex justify-start mb-6">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
        {/* Channel Configuration Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Channel Configuration</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your channel settings</p>
          </div>

          <form className="p-6 space-y-8" onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-md font-medium text-gray-900 dark:text-white border-l-4 border-blue-500 pl-3">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Channel Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors" 
                  required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Configuration */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Input Type</label>
                    <select 
                      value={inputType} 
                      onChange={(e) => setInputType(e.target.value)} 
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Input Type</option>
                      <option value="hls">HLS</option>
                      <option value="udp">UDP</option>
                      <option value="file">File</option>
                    </select>
                  </div>

                  {inputType === 'hls' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Input URL</label>
                      <input 
                        type="text" 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                      />
                    </div>
                  )}

                  {inputType === 'udp' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Input Multicast IP</label>
                        <input 
                          type="text" 
                          value={input} 
                          onChange={(e) => setInput(e.target.value)} 
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Input Network</label>
                        <select 
                          value={selectedInputNetwork} 
                          onChange={(e) => setSelectedInputNetwork(e.target.value)} 
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select Network</option>
                          {network.map((iface, i) => (
                            <option key={i} value={iface.ip_addresses}>
                              {iface.name} ({iface.ip_addresses})
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {inputType === 'file' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Input File</label>
                      <input 
                        type="text" 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                      />
                    </div>
                  )}
                </div>

                {/* Output Configuration */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output Type</label>
                    <select 
                      value={outputType} 
                      onChange={(e) => setOutputType(e.target.value)} 
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Output Type</option>
                      <option value="hls">HLS</option>
                      <option value="udp">UDP</option>
                      <option value="file">File</option>
                    </select>
                  </div>

                  {outputType === 'hls' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output URL</label>
                      <input 
                        type="text" 
                        value={output} 
                        onChange={(e) => setOutput(e.target.value)} 
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                      />
                    </div>
                  )}

                  {outputType === 'udp' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output Multicast IP</label>
                        <input 
                          type="text" 
                          value={output} 
                          onChange={(e) => setOutput(e.target.value)} 
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output Network</label>
                        <select 
                          value={selectedOutputNetwork} 
                          onChange={(e) => setSelectedOutputNetwork(e.target.value)} 
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select Network</option>
                          {network.map((iface, i) => (
                            <option key={i} value={iface.ip_addresses}>
                              {iface.name} ({iface.ip_addresses})
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {outputType === 'file' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output File</label>
                      <input 
                        type="text" 
                        value={output} 
                        onChange={(e) => setOutput(e.target.value)} 
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transcoding Parameters */}
            <div className="space-y-6">
              <h3 className="text-md font-medium text-gray-900 dark:text-white border-l-4 border-green-500 pl-3">Transcoding Parameters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Video Codec */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video Codec</label>
                  <select
                    value={videoCodec}
                    onChange={(e) => setVideoCodec(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">Select Video Codec</option>
                    <option value="libx264">H.264</option>
                    <option value="libx265">H.265</option>
                    <option value="mpeg2video">MPEG-2</option>
                  </select>
                </div>

                {/* Audio Codec */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audio Codec</label>
                  <select
                    value={audioCodec}
                    onChange={(e) => setAudioCodec(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">Select Audio Codec</option>
                    <option value="aac">AAC</option>
                    <option value="ac3">AC3</option>
                    <option value="mp2">MP2</option>
                  </select>
                </div>

                {/* Audio Gain */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audio Gain</label>
                  <input
                    type="number"
                    onWheel={e => e.target.blur()}
                    step="0.1"
                    value={audioGain}
                    onChange={(e) => setAudioGain(e.target.value)}
                    placeholder="e.g. 1.0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>

                {/* Bitrate Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bitrate Mode</label>
                  <select
                    value={bitrateMode}
                    onChange={(e) => setBitrateMode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">Select Bitrate Mode</option>
                    <option value="cbr">CBR</option>
                    <option value="vbr">VBR</option>
                  </select>
                </div>

                {/* Video Bitrate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video Bitrate</label>
                  <input
                    type="number"
                    onWheel={e => e.target.blur()}
                    value={videoBitrate}
                    onChange={(e) => setVideoBitrate(e.target.value)}
                    placeholder="bps"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>

                {/* Audio Bitrate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audio Bitrate</label>
                  <input
                    type="number"
                    onWheel={e => e.target.blur()}
                    value={audioBitrate}
                    onChange={(e) => setAudioBitrate(e.target.value)}
                    placeholder="bps"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>

                {/* Buffer Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Buffer Size</label>
                  <input
                    type="number"
                    onWheel={e => e.target.blur()}
                    value={bufferSize}
                    onChange={(e) => setBufferSize(e.target.value)}
                    placeholder="bits"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>

                {/* Service ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service ID</label>
                  <input
                    type="number"
                    onWheel={e => e.target.blur()}
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>

                {/* Video PID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video PID</label>
                  <input
                    type="number"
                    onWheel={e => e.target.blur()}
                    value={videoPid}
                    onChange={(e) => setVideoPid(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>

                {/* Audio PID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audio PID</label>
                  <input
                    type="number"
                    onWheel={e => e.target.blur()}
                    value={audioPid}
                    onChange={(e) => setAudioPid(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>

                {/* PMT PID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PMT PID</label>
                  <input
                    type="number"
                    onWheel={e => e.target.blur()}
                    value={pmtPid}
                    onChange={(e) => setPmtPid(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>

                {/* PCR PID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PCR PID</label>
                  <input
                    type="number"
                    onWheel={e => e.target.blur()}
                    value={pcrPid}
                    onChange={(e) => setPcrPid(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>

                {/* Scan Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scan Type</label>
                  <select
                    value={scanType}
                    onChange={(e) => setScanType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">Select Scan Type</option>
                    <option value="progressive">Progressive</option>
                    <option value="interlaced">Interlaced</option>
                  </select>
                </div>

                {/* Resolution */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resolution</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">Select Resolution</option>
                    <option value="1920x1080">1920x1080</option>
                    <option value="1280x720">1280x720</option>
                    <option value="1024x576">1024x576</option>
                    <option value="768x576">768x576</option>
                    <option value="854x480">854x480</option>
                    <option value="640x360">640x360</option>
                    <option value="426x240">426x240</option>
                  </select>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">Select Aspect Ratio</option>
                    <option value="16:9">16:9</option>
                    <option value="4:3">4:3</option>
                  </select>
                </div>

                {/* Frame Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frame Rate</label>
                  <select
                    value={frameRate}
                    onChange={(e) => setFrameRate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">Select Frame Rate</option>
                    <option value="24">24</option>
                    <option value="25">25</option>
                    <option value="30">30</option>
                    <option value="50">50</option>
                    <option value="60">60</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Logo Overlay */}
            <div className="space-y-6">
              <h3 className="text-md font-medium text-gray-900 dark:text-white border-l-4 border-purple-500 pl-3">Logo Overlay</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo Path</label>
                  <input 
                    type="text" 
                    value={logoPath} 
                    onChange={(e) => setLogoPath(e.target.value)} 
                    placeholder="/logos/channel-logo.png"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo Position</label>
                  <input 
                    type="text" 
                    value={logoPosition} 
                    onChange={(e) => setLogoPosition(e.target.value)} 
                    placeholder="x=10:y=10"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm" 
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format: x=10:y=10 or x=W-w-10:y=H-h-10</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo Opacity</label>
                  <input 
                    type="number" 
                    onWheel={e => e.target.blur()}
                    min="0.0" 
                    max="1.0" 
                    step="0.1"
                    value={logoOpacity} 
                    onChange={(e) => setLogoOpacity(e.target.value)} 
                    placeholder="0.0 - 1.0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm" 
                  />
                  {logoOpacity !== '' && (parseFloat(logoOpacity) < 0 || parseFloat(logoOpacity) > 1) && (
                    <p className="text-red-500 text-xs mt-1">Opacity must be between 0.0 and 1.0</p>
                  )}
                </div>
              </div>

              {/* Cross-field Validation */}
              {((logoPath || logoPosition || logoOpacity) && (!logoPath || !logoPosition || !logoOpacity)) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">Please fill in all logo fields: Path, Position, and Opacity.</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Update Channel
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}