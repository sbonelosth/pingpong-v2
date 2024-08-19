import React, { useEffect } from 'react';

const ApiCaller = () =>
{
    useEffect(() =>
    {
        const fetchData = async () =>
        {
            try
            {
                await fetch('https://pingpong-v2-server.onrender.com/room');
            } catch (error)
            {
                console.error('Error fetching data:', error);
            }
        };

        const intervalId = setInterval(fetchData, 300000);

        return () => clearInterval(intervalId);
    });

    return <></>;
};

export default ApiCaller;