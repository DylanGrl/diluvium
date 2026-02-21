import { useState, useCallback } from "react";
import type { FilterState } from "@/api/types";

export function useDashboardState() {
  // Filter state
  const [stateFilter, setStateFilter] = useState<FilterState>("All");
  const [trackerFilter, setTrackerFilter] = useState<string>("All");
  const [labelFilter, setLabelFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

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
    searchQuery !== "";

  const clearFilters = useCallback(() => {
    setStateFilter("All");
    setTrackerFilter("All");
    setLabelFilter("All");
    setSearchQuery("");
  }, []);

  return {
    // Filters
    stateFilter,
    setStateFilter,
    trackerFilter,
    setTrackerFilter,
    labelFilter,
    setLabelFilter,
    searchQuery,
    setSearchQuery,
    filterDict,
    hasActiveFilters,
    clearFilters,
    // Dialogs
    showAddDialog,
    setShowAddDialog,
    showSettings,
    setShowSettings,
    showRemoveDialog,
    setShowRemoveDialog,
    showNFODialog,
    setShowNFODialog,
    nfoHash,
    setNfoHash,
    showRemoveRatioDialog,
    setShowRemoveRatioDialog,
    showMobileSidebar,
    setShowMobileSidebar,
  };
}
