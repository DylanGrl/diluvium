import { useState, useCallback, useEffect } from "react";
import type { FilterState } from "@/api/types";
import { store } from "@/lib/store";

export type DateFilter = "all" | "today" | "week" | "month";

export function useDashboardState() {
  const saved = store.getFilterState();

  // Filter state — initialised from persisted store
  const [stateFilter, setStateFilter] = useState<FilterState>(saved.stateFilter as FilterState);
  const [trackerFilter, setTrackerFilter] = useState<string>(saved.trackerFilter);
  const [labelFilter, setLabelFilter] = useState<string>(saved.labelFilter);
  const [searchQuery, setSearchQuery] = useState(saved.searchQuery);
  const [dateFilter, setDateFilter] = useState<DateFilter>(saved.dateFilter as DateFilter);

  // Persist filter state whenever any filter changes
  useEffect(() => {
    store.setFilterState({ stateFilter, trackerFilter, labelFilter, dateFilter, searchQuery });
  }, [stateFilter, trackerFilter, labelFilter, dateFilter, searchQuery]);

  // Dialog visibility
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showNFODialog, setShowNFODialog] = useState(false);
  const [nfoHash, setNfoHash] = useState<string | null>(null);
  const [showRemoveRatioDialog, setShowRemoveRatioDialog] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const filterDict: Record<string, string> = {};
  if (stateFilter !== "All") filterDict.state = stateFilter;
  if (trackerFilter !== "All") filterDict.tracker_host = trackerFilter;
  if (labelFilter !== "All") filterDict.label = labelFilter;

  const hasActiveFilters =
    stateFilter !== "All" ||
    trackerFilter !== "All" ||
    labelFilter !== "All" ||
    searchQuery !== "" ||
    dateFilter !== "all";

  const clearFilters = useCallback(() => {
    setStateFilter("All");
    setTrackerFilter("All");
    setLabelFilter("All");
    setSearchQuery("");
    setDateFilter("all");
  }, []);

  return {
    stateFilter, setStateFilter,
    trackerFilter, setTrackerFilter,
    labelFilter, setLabelFilter,
    searchQuery, setSearchQuery,
    dateFilter, setDateFilter,
    filterDict,
    hasActiveFilters,
    clearFilters,
    showAddDialog, setShowAddDialog,
    showSettings, setShowSettings,
    showRemoveDialog, setShowRemoveDialog,
    showNFODialog, setShowNFODialog,
    nfoHash, setNfoHash,
    showRemoveRatioDialog, setShowRemoveRatioDialog,
    showMobileSidebar, setShowMobileSidebar,
  };
}
