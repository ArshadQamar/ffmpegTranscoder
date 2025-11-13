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
  const [network, setNetwork] = useState([]);
  const [selectedInputNetwork, setSelectedInputNetwork] = useState('');

  // Transcoding Parameters
  const [videoCodec, setVideoCodec] = useState('');
  const [audioCodec, setAudioCodec] = useState('');
  const [audioGain, setAudioGain] = useState('');
  const [bitrateMode, setBitrateMode] = useState('');
  const [frameRate, setFrameRate] = useState('');
  const [logoPath, setLogoPath] = useState('');
  const [logoPosition, setLogoPosition] = useState('');
  const [logoOpacity, setLogoOpacity] = useState('');
  const [scanType, setScanType] = useState('');
  const [aspectRatio, setAspectRatio] = useState('');

  // ABR Profiles - Always enabled
  const [abrProfiles, setAbrProfiles] = useState([]);

  useEffect(() => {
    if (!channelId) return;

    // Fetch channel details
    axios.get(`${apiUrl}/channels/${channelId}/`)
      .then((res) => {
        const data = res.data;
        setName(data.name);
        setInputType(data.input_type);
        setInput(data.input_url || data.input_multicast_ip || data.input_file || '');
        setSelectedInputNetwork(data.input_network || '');
        setVideoCodec(data.video_codec);
        setAudioCodec(data.audio);
        setAudioGain(data.audio_gain);
        setBitrateMode(data.bitrate_mode);
        setFrameRate(data.frame_rate);
        setLogoPath(data.logo_path || '');
        setLogoPosition(data.logo_position || '');
        setLogoOpacity(data.logo_opacity || '');
        setScanType(data.scan_type);
        setAspectRatio(data.aspect_ratio);
        
        // Set ABR profiles - always use ABR structure
        if (data.abr_profiles && data.abr_profiles.length > 0) {
          setAbrProfiles(data.abr_profiles);
        } else {
          // Convert single channel to ABR profile structure
          setAbrProfiles([{
            id: Date.now(),
            output_type: data.output_type || 'udp',
            output_url: data.output_url || '',
            output_multicast_ip: data.output_multicast_ip || '',
            output_network: data.output_network || '',
            video_bitrate: data.video_bitrate || '',
            audio_bitrate: data.audio_bitrate || '',
            buffer_size: data.buffer_size || '',
            resolution: data.resolution || '',
            service_id: data.service_id || '',
            video_pid: data.video_pid || '',
            audio_pid: data.audio_pid || '',
            pmt_pid: data.pmt_pid || '',
            pcr_pid: data.pcr_pid || '',
            muxrate: data.muxrate || ''
          }]);
        }
        
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

  const addAbrProfile = () => {
    const newProfile = {
      id: Date.now(), // temporary ID for frontend
      output_type: 'udp',
      output_url: '',
      output_multicast_ip: '',
      output_network: '',
      video_bitrate: '',
      audio_bitrate: '',
      buffer_size: '',
      resolution: '',
      service_id: '',
      video_pid: '',
      audio_pid: '',
      pmt_pid: '',
      pcr_pid: '',
      muxrate: ''
    };
    setAbrProfiles([...abrProfiles, newProfile]);
  };

  const updateAbrProfile = (index, field, value) => {
    const updatedProfiles = [...abrProfiles];
    updatedProfiles[index] = {
      ...updatedProfiles[index],
      [field]: value
    };
    setAbrProfiles(updatedProfiles);
  };

  const removeAbrProfile = (index) => {
    // Don't allow removing the last profile
    if (abrProfiles.length <= 1) return;
    
    const updatedProfiles = [...abrProfiles];
    updatedProfiles.splice(index, 1);
    setAbrProfiles(updatedProfiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Payload with ABR always enabled
    const payload = {
      name,
      status: "stopped",
      input_type: inputType,
      input_url: inputType === 'hls' ? input : null,
      input_multicast_ip: inputType === 'udp' ? input : null,
      input_network: inputType === 'udp' ? selectedInputNetwork : null,
      input_file: inputType === 'file' ? input : null,
      
      // No main output fields since we're always using ABR
      output_type: null,
      output_url: null,
      output_multicast_ip: null,
      output_network: null,
      output_file: null,

      // Input processing settings only
      video_codec: videoCodec,
      audio: audioCodec,
      audio_gain: parseFloat(audioGain) || 1.0,
      bitrate_mode: bitrateMode,
      scan_type: scanType,
      aspect_ratio: aspectRatio,
      frame_rate: parseInt(frameRate) || 0,

      logo_path: logoPath || null,
      logo_position: logoPosition || null,
      logo_opacity: parseFloat(logoOpacity) || null,

      // ABR always enabled
      is_abr: true,

      // No main encoding fields since they're in ABR profiles
      video_bitrate: null,
      audio_bitrate: null,
      buffer_size: null,
      service_id: null,
      audio_pid: null,
      video_pid: null,
      pmt_pid: null,
      pcr_pid: null,
      resolution: null,

      // ABR profiles
      abr_profiles: abrProfiles.map(profile => ({
        ...profile,
        video_bitrate: parseInt(profile.video_bitrate) || 0,
        audio_bitrate: parseInt(profile.audio_bitrate) || 0,
        buffer_size: parseInt(profile.buffer_size) || 0,
        service_id: parseInt(profile.service_id) || 1,
        video_pid: parseInt(profile.video_pid) || 0,
        audio_pid: parseInt(profile.audio_pid) || 0,
        pmt_pid: parseInt(profile.pmt_pid) || 0,
        pcr_pid: parseInt(profile.pcr_pid) || 0,
        muxrate: parseInt(profile.muxrate) || 0
      }))
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
        alert(`Failed to update channel:\n${messages}`);
      } else {
        alert('Failed to update channel');
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
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Channel</h1>
            </div>

            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div 
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => router.push('/')}
              >
                <Image src={TVNLogo} alt="TVN Logo" width={120} height={120} priority />
              </div>
            </div>

            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your channel</p>
          </div>

          <form className="p-6 space-y-8" onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="space-y-6">              
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

                {/* ABR Info Panel */}
                <div className="space-y-4">
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-orange-800 dark:text-orange-300 text-sm font-medium">Output Configuration</span>
                    </div>
                    <p className="text-orange-700 dark:text-orange-400 text-sm mt-2">
                      Output settings are configured in the section below. 
                      {abrProfiles.length === 1 ? " You currently have 1 output profile." : ` You currently have ${abrProfiles.length} output profiles.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ABR Profiles Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium text-gray-900 dark:text-white border-l-4 border-orange-500 pl-3">
                  Profiles {abrProfiles.length > 0 && `(${abrProfiles.length})`}
                </h3>
                <button
                  type="button"
                  onClick={addAbrProfile}
                  className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Profile
                </button>
              </div>

              <div className="space-y-4">
                {abrProfiles.map((profile, index) => (
                  <div key={profile.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Output Profile {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeAbrProfile(index)}
                        disabled={abrProfiles.length <= 1}
                        className={`transition-colors ${
                          abrProfiles.length <= 1 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Output Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output Type</label>
                        <select
                          value={profile.output_type}
                          onChange={(e) => updateAbrProfile(index, 'output_type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="udp">UDP</option>
                          <option value="hls">HLS</option>
                        </select>
                      </div>

                      {/* Output Configuration based on type */}
                      {profile.output_type === 'udp' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output Multicast IP</label>
                            <input
                              type="text"
                              value={profile.output_multicast_ip}
                              onChange={(e) => updateAbrProfile(index, 'output_multicast_ip', e.target.value)}
                              placeholder="239.0.0.1:6000"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output Network Interface</label>
                            <select
                              value={profile.output_network}
                              onChange={(e) => updateAbrProfile(index, 'output_network', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                            >
                              <option value="">Select Network Interface</option>
                              {network.map((iface, i) => (
                                <option key={i} value={iface.ip_addresses}>
                                  {iface.name} ({iface.ip_addresses})
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {profile.output_type === 'hls' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output URL</label>
                          <input
                            type="text"
                            value={profile.output_url}
                            onChange={(e) => updateAbrProfile(index, 'output_url', e.target.value)}
                            placeholder="http://example.com/stream.m3u8"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                          />
                        </div>
                      )}

                      {/* Video Bitrate */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video Bitrate (bps)</label>
                        <input
                          type="number"
                          onWheel={e => e.target.blur()}
                          value={profile.video_bitrate}
                          onChange={(e) => updateAbrProfile(index, 'video_bitrate', e.target.value)}
                          placeholder="e.g. 2400000"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>

                      {/* Audio Bitrate */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audio Bitrate (bps)</label>
                        <input
                          type="number"
                          onWheel={e => e.target.blur()}
                          value={profile.audio_bitrate}
                          onChange={(e) => updateAbrProfile(index, 'audio_bitrate', e.target.value)}
                          placeholder="e.g. 128000"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>

                      {/* Buffer Size */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Buffer Size (bps)</label>
                        <input
                          type="number"
                          onWheel={e => e.target.blur()}
                          value={profile.buffer_size}
                          onChange={(e) => updateAbrProfile(index, 'buffer_size', e.target.value)}
                          placeholder="e.g. 4800000"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>

                      {/* Resolution */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resolution</label>
                        <select
                          value={profile.resolution}
                          onChange={(e) => updateAbrProfile(index, 'resolution', e.target.value)}
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

                      {/* Service ID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service ID</label>
                        <input
                          type="number"
                          onWheel={e => e.target.blur()}
                          value={profile.service_id}
                          onChange={(e) => updateAbrProfile(index, 'service_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="1-9999"
                        />
                      </div>

                      {/* Video PID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video PID</label>
                        <input
                          type="number"
                          onWheel={e => e.target.blur()}
                          value={profile.video_pid}
                          onChange={(e) => updateAbrProfile(index, 'video_pid', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="1-9999"
                        />
                      </div>

                      {/* Audio PID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audio PID</label>
                        <input
                          type="number"
                          onWheel={e => e.target.blur()}
                          value={profile.audio_pid}
                          onChange={(e) => updateAbrProfile(index, 'audio_pid', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="1-9999"
                        />
                      </div>

                      {/* PMT PID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PMT PID</label>
                        <input
                          type="number"
                          onWheel={e => e.target.blur()}
                          value={profile.pmt_pid}
                          onChange={(e) => updateAbrProfile(index, 'pmt_pid', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="37-8186"
                        />
                      </div>

                      {/* PCR PID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PCR PID</label>
                        <input
                          type="number"
                          onWheel={e => e.target.blur()}
                          value={profile.pcr_pid}
                          onChange={(e) => updateAbrProfile(index, 'pcr_pid', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                          placeholder="37-8186"
                        />
                      </div>

                      {/* Muxrate */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Muxrate (bps)</label>
                        <input
                          type="number"
                          onWheel={e => e.target.blur()}
                          value={profile.muxrate}
                          onChange={(e) => updateAbrProfile(index, 'muxrate', e.target.value)}
                          placeholder="e.g. 5000000"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transcoding Parameters - Input Settings Only */}
            <div className="space-y-6">
              <h3 className="text-md font-medium text-gray-900 dark:text-white border-l-4 border-green-500 pl-3">
                Audio/Video Settings
              </h3>
              
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