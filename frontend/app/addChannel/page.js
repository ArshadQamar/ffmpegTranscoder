'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TVNLogo from '../TVN-logo.png';
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
  const [isAbr, setIsAbr] = useState(false);

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

  // ABR Profiles
  const [abrProfiles, setAbrProfiles] = useState([]);

  //json file
  let [importedFileName, setImportedFileName] = useState(null);

  useEffect(() => {
    // Fetch network interfaces from API
    axios.get(`${apiUrl}/netiface`)
      .then(response => {
        setNetwork(response.data);
        console.log(response.data)
      })
      .catch(error => {
        console.error('Error fetching network interfaces:', error);
      });
  }, []);

  // ABR Profile Management
  const addAbrProfile = () => {
    const newProfile = {
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
    updatedProfiles[index][field] = value;
    setAbrProfiles(updatedProfiles);
  };

  const removeAbrProfile = (index) => {
    const updatedProfiles = [...abrProfiles];
    updatedProfiles.splice(index, 1);
    setAbrProfiles(updatedProfiles);
  };

  //Validating JSON
  const validateChannelJson = (data)=>{
    const REQUIRED_FIELDS = [
      "name", "input_type", "output_type", "input_multicast_ip", "output_multicast_ip",
      "input_network", "output_network", "video_codec", "audio", "audio_gain",
      "bitrate_mode", "video_bitrate", "audio_bitrate", "buffer_size", "resolution",
      "frame_rate", "service_id", "video_pid", "audio_pid", "pmt_pid", "pcr_pid",
      "scan_type", "aspect_ratio", "logo_path", "logo_position", "logo_opacity", 
      "id", "status", "job_id", "input_url", "input_file", "output_url", "output_file",
      "is_abr", "abr_profiles"
    ];
    //check missing fields
    const missing = REQUIRED_FIELDS.filter(f => !(f in data))
    if (missing.length > 0){
      return `Missing required fields: ${missing.join(", ")}`
    }
    // extra fields
    const extra = Object.keys(data).filter(f=>!(REQUIRED_FIELDS.includes(f)));
    if (extra.length > 0){
      return `Unexpected fields found: ${extra.join(", ")}`;
    }
  }

  //Handle JSON upload
  const handleFileUpload = (e) =>{
    const file = e.target.files[0]
    if (!file) {
      console.error("No valid file not found")
      return
    }
    
    const reader = new FileReader();
    reader.onload = (event)=>{
      try{
        const data = JSON.parse(event.target.result)
        const validationError = validateChannelJson(data)
        if (validationError){
          alert("Invalid JSON: " + validationError);
          return
        }
        setImportedFileName(file.name)
        console.log(data)
        
        // Fill state with JSON values
        setName(data.name || "");
        setInputType(data.input_type || "");
        setInput(data.input_url || data.input_multicast_ip || data.input_file || "");
        setSelectedInputNetwork(data.input_network || "");
        setOutputType(data.output_type || "");
        setOutput(data.output_url || data.output_multicast_ip || data.output_file || "");
        setSelectedOutputNetwork(data.output_network || "");
        setVideoCodec(data.video_codec || "");
        setAudioCodec(data.audio || "");
        setAudioGain(data.audio_gain?.toString() || "");
        setBitrateMode(data.bitrate_mode || "");
        setVideoBitrate(data.video_bitrate?.toString() || "");
        setAudioBitrate(data.audio_bitrate?.toString() || "");
        setBufferSize(data.buffer_size?.toString() || "");
        setResolution(data.resolution || "");
        setFrameRate(data.frame_rate?.toString() || "");
        setServiceId(data.service_id?.toString() || "");
        setVideoPid(data.video_pid?.toString() || "");
        setAudioPid(data.audio_pid?.toString() || "");
        setPmtPid(data.pmt_pid?.toString() || "");
        setPcrPid(data.pcr_pid?.toString() || "");
        setScanType(data.scan_type || "");
        setAspectRatio(data.aspect_ratio || "");
        setLogoPath(data.logo_path || "");
        setLogoPosition(data.logo_position || "");
        setLogoOpacity(data.logo_opacity?.toString() || "");
        setIsAbr(data.is_abr || false);
        
        // Handle ABR profiles
        if (data.is_abr && data.abr_profiles) {
          setAbrProfiles(data.abr_profiles.map(profile => ({
            output_type: profile.output_type || 'udp',
            output_url: profile.output_url || '',
            output_multicast_ip: profile.output_multicast_ip || '',
            output_network: profile.output_network || '',
            video_bitrate: profile.video_bitrate?.toString() || '',
            audio_bitrate: profile.audio_bitrate?.toString() || '',
            buffer_size: profile.buffer_size?.toString() || '',
            resolution: profile.resolution || '',
            service_id: profile.service_id?.toString() || '',
            video_pid: profile.video_pid?.toString() || '',
            audio_pid: profile.audio_pid?.toString() || '',
            pmt_pid: profile.pmt_pid?.toString() || '',
            pcr_pid: profile.pcr_pid?.toString() || '',
            muxrate: profile.muxrate?.toString() || ''
          })));
        }

      }catch(error){
        alert("Invalid JSON File")
        console.error("error parsing JSON", error)
      }
    }
    reader.readAsText(file);
  }

  //Handling submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('submit clicked')
    
    // Base payload
    const payload = {
      name,
      input_type: inputType,
      input_url: inputType === 'hls' ? input: null,
      input_multicast_ip: inputType === 'udp' ? input: null,
      input_network: inputType === 'udp' ? selectedInputNetwork: null,
      input_file: inputType === 'file' ? input : null,

      output_type: isAbr ? null : outputType,
      output_url: isAbr ? null : (outputType === 'hls' ? output : null),
      output_multicast_ip: isAbr ? null : (outputType === 'udp' ? output : null),
      output_network: isAbr ? null : (outputType === 'udp' ? selectedOutputNetwork : null),
      output_file: isAbr ? null : (outputType === 'file' ? output : null),

      video_codec: videoCodec,
      audio: audioCodec,
      audio_gain: parseFloat(audioGain) || 1.0,
      bitrate_mode: bitrateMode,
      video_bitrate: isAbr ? null : (parseInt(videoBitrate) || null),
      audio_bitrate: isAbr ? null : (parseInt(audioBitrate) || null),
      buffer_size: isAbr ? null : (parseInt(bufferSize) || null),
      service_id: isAbr ? null : (parseInt(serviceId) || null),
      audio_pid: isAbr ? null : (parseInt(audioPid) || null),
      video_pid: isAbr ? null : (parseInt(videoPid) || null),
      pmt_pid: isAbr ? null : (parseInt(pmtPid) || null),
      pcr_pid: isAbr ? null : (parseInt(pcrPid) || null),
      resolution: isAbr ? null : resolution,
      scan_type: scanType,
      aspect_ratio: aspectRatio,
      frame_rate: parseInt(frameRate) || 0,

      logo_path: logoPath || null,
      logo_position: logoPosition || null,
      logo_opacity: parseFloat(logoOpacity) || null,

      is_abr: isAbr,
    };

    // Add ABR profiles if enabled
    if (isAbr) {
      payload.abr_profiles = abrProfiles.map(profile => ({
        output_type: profile.output_type,
        output_url: profile.output_type === 'hls' ? profile.output_url : null,
        output_multicast_ip: profile.output_type === 'udp' ? profile.output_multicast_ip : null,
        output_network: profile.output_type === 'udp' ? profile.output_network : null,
        video_bitrate: parseInt(profile.video_bitrate) || 0,
        audio_bitrate: parseInt(profile.audio_bitrate) || 0,
        buffer_size: parseInt(profile.buffer_size) || 0,
        resolution: profile.resolution,
        service_id: parseInt(profile.service_id) || 0,
        video_pid: parseInt(profile.video_pid) || 0,
        audio_pid: parseInt(profile.audio_pid) || 0,
        pmt_pid: parseInt(profile.pmt_pid) || 0,
        pcr_pid: parseInt(profile.pcr_pid) || 0,
        muxrate: parseInt(profile.muxrate) || 0
      }));
    }

    try{
      const response = await axios.post(`${apiUrl}/channels/`, payload);
      console.log(response.data)
      if(response.status === 201 || response.status === 200){
        alert(`channel created succesfully`);
        router.push('/')
      }else{
        alert(`unexpected response ${response.status}`);
      }

    }catch(error){
      if(error.response?.data?.error) {
        const messages = error.response.data.error
        .map(err => `${err.fields}: ${err.message}`)
        .join('\n')
        alert(`Failed to create channel:\n${messages}`);
      }else{
        alert(`Failed to create channel`);
      }
    }
  }

  return (
    <>
      {/* Header with Centered Logo */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Create Channel Text on Left */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create New Channel</h1>
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

            {/* JSON Import Button */}
            <div className="flex items-center gap-3">
              <input
                type='file'
                id="json-upload"
                accept='application/json'
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="json-upload"
                className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Import JSON
              </label>
              {importedFileName && (
                <span className="text-gray-700 dark:text-gray-300 text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                  {importedFileName}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>


      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new channel with the settings below</p>
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
                  placeholder="Enter channel name"
                  required
                />
              </div>

              {/* ABR Toggle */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="abr-toggle"
                  checked={isAbr}
                  onChange={(e) => setIsAbr(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="abr-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Adaptive Bitrate (ABR) - Multiple Output Profiles
                </label>
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
                        value={input}
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="http://example.com/stream.m3u8"
                        onChange={(e)=>setInput(e.target.value)}
                      />
                    </div>
                  )}

                  {inputType === 'udp' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Input Multicast IP</label>
                        <input
                          value={input}
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="239.0.0.1:5000"
                          onChange={(e)=>setInput(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Input Network Interface</label>
                        <select
                          value={selectedInputNetwork}
                          onChange={(e) => setSelectedInputNetwork(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select Network Interface</option>
                          {network.map((iface, index) => (
                            <option key={index} value={iface.ip_addresses}>
                              {iface.name} ({iface.ip_addresses})
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {inputType === 'file' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File Path</label>
                      <input 
                        value={input}
                        type="text" 
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        onChange={(e)=>setInput(e.target.value)}
                        placeholder='/file/path/video.mp4'
                      />
                    </div>
                  )}
                </div>

                {/* Output Configuration - Only show for non-ABR */}
                {!isAbr && (
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

                    {outputType === 'udp' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output Multicast IP</label>
                          <input
                            value={output}
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="239.0.0.2:6000"
                            onChange={(e)=>setOutput(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output Network Interface</label>
                          <select
                            value={selectedOutputNetwork}
                            onChange={(e) => setSelectedOutputNetwork(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Select Network Interface</option>
                            {network.map((iface, index) => (
                              <option key={index} value={iface.ip_addresses}>
                                {iface.name} ({iface.ip_addresses})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {outputType === 'hls' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output URL</label>
                        <input
                          value={output}
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="http://example.com/stream.m3u8"
                          onChange={(e)=>setOutput(e.target.value)}
                        />
                      </div>
                    )}

                    {outputType === 'file' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output File Path</label>
                        <input 
                          value={output}
                          type="text" 
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          onChange={(e)=>setOutput(e.target.value)}
                          placeholder='/file/path/name.mp4'
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ABR Notice */}
                {isAbr && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-blue-800 dark:text-blue-300 text-sm font-medium">ABR Mode Enabled</span>
                      </div>
                      <p className="text-blue-700 dark:text-blue-400 text-sm mt-2">
                        Output configurations will be defined in individual ABR profiles below. The main channel acts as the input source only.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ABR Profiles Section */}
            {isAbr && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white border-l-4 border-orange-500 pl-3">ABR Profiles</h3>
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

                {abrProfiles.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No ABR profiles added yet. Click "Add Profile" to create your first rendition.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {abrProfiles.map((profile, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Profile {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeAbrProfile(index)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
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
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                  placeholder="239.0.0.1:6000"
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
                                  {network.map((iface, idx) => (
                                    <option key={idx} value={iface.ip_addresses}>
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
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                placeholder="http://example.com/stream.m3u8"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                              placeholder="e.g. 2400000"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                              placeholder="e.g. 128000"
                            />
                          </div>

                          {/* Buffer Size */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Buffer Size (bits)</label>
                            <input
                              type="number"
                              onWheel={e => e.target.blur()}
                              value={profile.buffer_size}
                              onChange={(e) => updateAbrProfile(index, 'buffer_size', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                              placeholder="e.g. 4800000"
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
                              placeholder="1-9999"
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
                              placeholder="1-9999"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                              placeholder="e.g. 5000000"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Transcoding Parameters - Hide encoding fields for ABR */}
            <div className="space-y-6">
              <h3 className="text-md font-medium text-gray-900 dark:text-white border-l-4 border-green-500 pl-3">
                Transcoding Parameters {isAbr && "(Input Settings)"}
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="e.g. 1.0"
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

                {/* Video Bitrate - Hide for ABR */}
                {!isAbr && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video Bitrate (bps)</label>
                    <input
                      type="number"
                      onWheel={e => e.target.blur()}
                      value={videoBitrate}
                      onChange={(e) => setVideoBitrate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="e.g. 2400000"
                    />
                  </div>
                )}

                {/* Audio Bitrate - Hide for ABR */}
                {!isAbr && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audio Bitrate (bps)</label>
                    <input
                      type="number"
                      onWheel={e => e.target.blur()}
                      value={audioBitrate}
                      onChange={(e) => setAudioBitrate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="e.g. 128000"
                    />
                  </div>
                )}

                {/* Buffer Size - Hide for ABR */}
                {!isAbr && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Buffer Size (bits)</label>
                    <input
                      type="number"
                      onWheel={e => e.target.blur()}
                      value={bufferSize}
                      onChange={(e) => setBufferSize(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="e.g. 4800000"
                    />
                  </div>
                )}

                {/* Service ID - Hide for ABR */}
                {!isAbr && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service ID</label>
                    <input
                      type="number"
                      onWheel={e => e.target.blur()}
                      value={serviceId}
                      onChange={(e)=>setServiceId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="1-9999"
                    />
                  </div>
                )}

                {/* Video PID - Hide for ABR */}
                {!isAbr && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video PID</label>
                    <input
                      type="number"
                      onWheel={e => e.target.blur()}
                      value={videoPid}
                      onChange={(e)=>setVideoPid(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="1-9999"
                    />
                  </div>
                )}

                {/* Audio PID - Hide for ABR */}
                {!isAbr && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audio PID</label>
                    <input
                      type="number"
                      onWheel={e => e.target.blur()}
                      value={audioPid}
                      onChange={(e)=>setAudioPid(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="1-9999"
                    />
                  </div>
                )}

                {/* PMT PID - Hide for ABR */}
                {!isAbr && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PMT PID</label>
                    <input
                      type="number"
                      onWheel={e => e.target.blur()}
                      value={pmtPid}
                      onChange={(e)=>setPmtPid(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="1-9999"
                    />
                  </div>
                )}

                {/* PCR PID - Hide for ABR */}
                {!isAbr && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PCR PID</label>
                    <input
                      type="number"
                      onWheel={e => e.target.blur()}
                      value={pcrPid}
                      onChange={(e)=>setPcrPid(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="1-9999"
                    />
                  </div>
                )}

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

                {/* Resolution - Hide for ABR */}
                {!isAbr && (
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
                )}

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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frame Rate (fps)</label>
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="/logos/channel-logo.png"
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
                    step="0.01"
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
                Create Channel
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}