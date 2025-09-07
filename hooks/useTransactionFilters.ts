"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterState, Transaction } from "@/lib/types";
import { 
  parseFiltersFromUrl,
  filterTransactions,
  applySearchFilter
} from "@/lib/utils";
import { getSelectedUser, saveSelectedUser } from "@/lib/persistent-user-selection";

export function useTransactionFilters(allTransactions: Transaction[]) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("Tutte le Categorie");

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<FilterState>(() => {
    const urlFilters = parseFiltersFromUrl(searchParams);
    // If no member filter in URL, try localStorage
    if (!urlFilters.member || urlFilters.member === 'all') {
      const savedUser = getSelectedUser();
      if (savedUser) {
        urlFilters.member = savedUser;
      }
    }
    return urlFilters;
  });

  const selectedGroupFilter = filters.member || 'all';
  
  const setSelectedGroupFilter = (value: string) => {
    setFilters(prev => ({ ...prev, member: value }));
    saveSelectedUser(value);
  };

  // Get filtered transactions based on selected group filter
  const filteredByUser = useMemo(() => {
    if (selectedGroupFilter === 'all') {
      return allTransactions;
    }
    return allTransactions.filter(tx => tx.user_id === selectedGroupFilter);
  }, [allTransactions, selectedGroupFilter]);

  const filteredTransactions = useMemo(() => {
    return filterTransactions(filteredByUser, filters);
  }, [filteredByUser, filters]);

  const searchFilteredTransactions = useMemo(() => {
    return applySearchFilter(searchQuery, filteredTransactions);
  }, [searchQuery, filteredTransactions]);

  // Update filters when URL changes
  useEffect(() => {
    const urlFilters = parseFiltersFromUrl(searchParams);
    setFilters(urlFilters);
  }, [searchParams]);

  // Sync UI state with URL filters
  useEffect(() => {
    if (filters.category && filters.category !== 'all') {
      setSelectedCategory(filters.category.charAt(0).toUpperCase() + filters.category.slice(1));
    } else {
      setSelectedCategory("Tutte le Categorie");
    }

    if (filters.type && filters.type !== 'all') {
      setSelectedFilter(filters.type.charAt(0).toUpperCase() + filters.type.slice(1));
    } else {
      setSelectedFilter("All");
    }
  }, [filters]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.member && filters.member !== 'all') {
      params.set('member', filters.member);
    }
    if (filters.category && filters.category !== 'all') {
      params.set('category', encodeURIComponent(filters.category));
    }
    if (filters.type && filters.type !== 'all') {
      params.set('type', filters.type);
    }
    if (filters.dateRange && filters.dateRange !== 'all') {
      params.set('dateRange', filters.dateRange);
    }
    if (filters.minAmount) {
      params.set('minAmount', filters.minAmount);
    }
    if (filters.maxAmount) {
      params.set('maxAmount', filters.maxAmount);
    }
    if (searchParams.get('from')) {
      params.set('from', searchParams.get('from')!);
    }
    if (searchParams.get('budget')) {
      params.set('budget', searchParams.get('budget')!);
    }

    const newUrl = params.toString() ? `/transactions?${params.toString()}` : '/transactions';
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const currentUrl = currentPath + currentSearch;

    if (currentUrl !== newUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [filters, searchParams, router]);

  // Sync selectedFilter and selectedCategory with filters
  useEffect(() => {
    const expectedType = selectedFilter === "All" ? 'all' : selectedFilter.toLowerCase();
    const expectedCategory = selectedCategory === "Tutte le Categorie" ? 'all' : selectedCategory.toLowerCase();

    if (filters.type !== expectedType || filters.category !== expectedCategory) {
      setFilters(prev => ({
        ...prev,
        type: expectedType,
        category: expectedCategory
      }));
    }
  }, [selectedFilter, selectedCategory, filters.type, filters.category]);

  const resetFilters = () => {
    setSelectedFilter("All");
    setSelectedCategory("Tutte le Categorie");
    setSearchQuery("");
  };

  const hasActiveFilters = selectedFilter !== "All" || 
                          selectedCategory !== "Tutte le Categorie" || 
                          searchQuery !== "";

  return {
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    selectedCategory,
    setSelectedCategory,
    selectedGroupFilter,
    setSelectedGroupFilter,
    filteredTransactions: searchFilteredTransactions,
    filteredByUser,
    resetFilters,
    hasActiveFilters,
    filters,
    setFilters
  };
}