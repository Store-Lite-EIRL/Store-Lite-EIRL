'use client';

import { useAuth } from '@/features/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import FeaturedItems from './home/FeaturedItems';
import FilterBar from './home/FilterBar';
import Hero from './home/Hero';
import Pagination from './home/Pagination';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/list-business');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return null; // Or a simple loader
  }

  return (
    <div className="page-container">
      <Hero />
      <FeaturedItems />
      <FilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {activeTab === 'products' && (
        <Pagination totalPages={1} currentPage={1} onPageChange={() => {}} />
      )}

      {activeTab === 'bestsellers' && (
        <Pagination totalPages={1} currentPage={1} onPageChange={() => {}} />
      )}

      {activeTab === 'about' && (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Sobre Store Lite</h2>
          <p>Bienvenido a nuestra plataforma de tiendas virtuales.</p>
        </div>
      )}
    </div>
  );
}
