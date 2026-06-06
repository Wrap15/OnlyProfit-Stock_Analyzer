'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function GlobalLoadingBar() {
  const [activeRequests, setActiveRequests] = useState(0);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        setActiveRequests((prev) => prev + 1);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        setActiveRequests((prev) => Math.max(0, prev - 1));
        return response;
      },
      (error) => {
        setActiveRequests((prev) => Math.max(0, prev - 1));
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  if (activeRequests === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] bg-transparent overflow-hidden pointer-events-none">
      <div 
        className="h-full bg-gradient-to-r from-profit/20 via-profit to-profit/20 animate-shimmer"
        style={{
          width: '200%',
          transform: 'translateX(-25%)',
        }}
      />
    </div>
  );
}
