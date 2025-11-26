import React from 'react';

const VideoGrid = ({ players, activeSpeaker, connectedPlayers = [], waitingForUserResponse = false, isSpeaking = false, userAvatar = null }) => {
    // Track previous connected players to trigger SFX
    const prevConnectedRef = React.useRef(connectedPlayers.length);

    React.useEffect(() => {
        const currentCount = connectedPlayers.length;
        const prevCount = prevConnectedRef.current;

        if (currentCount > prevCount) {
            // Player Joined SFX
            new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3').play().catch(e => { });
        } else if (currentCount < prevCount) {
            // Player Left SFX
            new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3').play().catch(e => { });
        }

        prevConnectedRef.current = currentCount;
    }, [connectedPlayers.length]);

    // Filter players to only show those connected
    // We want to maintain a consistent order if possible, or just append
    const allPlayerIds = ['player1', 'player2', 'player3', 'player4', 'moderator'];
    const visiblePlayers = allPlayerIds.filter(id => connectedPlayers.includes(id));

    // Dynamic grid cols based on count
    const gridCols = visiblePlayers.length <= 2 ? 'grid-cols-1 md:grid-cols-2' :
        visiblePlayers.length <= 4 ? 'grid-cols-2' :
            'grid-cols-2 md:grid-cols-3';

    // Helper to get image path
    const getImagePath = (id) => {
        // Map player IDs to their character folders
        const folderMap = {
            'player2': 'player 1', // Wario
            'player3': 'player 2', // Domis
            'player4': 'player 3', // Scan
            'moderator': 'moderator' // President Dorkesh
        };

        const imageMap = {
            'player2': 'Wario_Wooden.jpg',
            'player3': 'Domis_Wooden.jpg',
            'player4': 'Scan_Wooden.jpg',
            'moderator': 'Dorkesh_Wooden.jpg'
        };

        const folder = folderMap[id];
        const imageName = imageMap[id];

        return `/images/characters/${folder}/${imageName}`;
    };

    return (
        <div className="h-full w-full p-4">
            <div className={`grid ${gridCols} gap-4 h-full transition-all duration-500`}>
                {visiblePlayers.map((id) => {
                    const player = players[id] || { name: 'Unknown', isHuman: false };
                    const isMe = id === 'player1';
                    const isPresident = id === 'moderator';

                    // Active if server says so OR if it's me and I'm speaking locally
                    const isActive = activeSpeaker === id || (isMe && isSpeaking);

                    // User's turn indicator - show green border when waiting for user response
                    // Only show user turn indicator if NO ONE is actively speaking
                    const isUserTurn = isMe && waitingForUserResponse && !activeSpeaker && !isSpeaking;

                    return (
                        <div
                            key={id}
                            className={`relative h-full rounded-xl overflow-hidden border-4 transition-all duration-300 bg-gray-800 border-gray-700
                                ${isActive ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-[1.02]' : ''}
                                ${isUserTurn ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-pulse' : ''}
                                ${isPresident ? 'border-red-600' : ''}
                            `}
                        >
                            {/* Avatar / Video Placeholder */}
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                {!isMe && (
                                    <img
                                        src={getImagePath(id)}
                                        alt={player.name}
                                        className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = 'none'; // Hide broken image
                                            // Show fallback sibling
                                            const fallback = e.target.nextElementSibling;
                                            if (fallback) fallback.classList.remove('hidden');
                                        }}
                                    />
                                )}
                                {/* Show user's uploaded avatar or fallback */}
                                {isMe && userAvatar && (
                                    <img
                                        src={userAvatar}
                                        alt={player.name}
                                        className="w-full h-full object-cover opacity-80"
                                    />
                                )}
                                {/* Fallback if image fails or if it's me without avatar */}
                                {isMe && !userAvatar && (
                                    <div className="text-6xl font-bold">
                                        {player.name.charAt(0)}
                                    </div>
                                )}
                                {/* Fallback for AI players if image fails */}
                                {!isMe && (
                                    <div className="hidden text-6xl font-bold">
                                        {isPresident ? '🏛️' : player.name.charAt(0)}
                                    </div>
                                )}
                            </div>

                            {/* Name Tag */}
                            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg backdrop-blur-sm">
                                <span className={`font - bold ${isPresident ? 'text-red-400' : 'text-white'} `}>
                                    {player.name}
                                </span>
                            </div>

                            {/* Speaking Indicator */}
                            {isActive && (
                                <div className="absolute top-4 right-4 flex gap-1">
                                    <div className={`w-1 h-4 animate-pulse ${isPresident ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    <div className={`w-1 h-6 animate-pulse delay-75 ${isPresident ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    <div className={`w-1 h-4 animate-pulse delay-150 ${isPresident ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VideoGrid;
