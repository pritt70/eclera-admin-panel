"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, Layers, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/select";
import { api } from "@/helper";

export function CollectionCategorySpecSelector({
  categories = [],
  selectedCategoryIds = [],
  onCategoryIdsChange,
  assignedSpecifications = [],
  onSpecificationsChange,
  loadingCategories = false,
  existingCollectionSpecs = [],
}: any) {
  const [categoryDetailsMap, setCategoryDetailsMap] = useState<Record<string, any>>({});
  const [loadingCategoryIds, setLoadingCategoryIds] = useState<Record<string, boolean>>({});
  const fetchedCategoryIdsRef = useRef<Set<string>>(new Set());

  // Active selection tab on the left: { categoryId, specificationId }
  const [activeTab, setActiveTab] = useState<{ categoryId: string; specificationId: string } | null>(null);

  // Load category details and specifications whenever selectedCategoryIds changes
  useEffect(() => {
    if (!Array.isArray(selectedCategoryIds) || selectedCategoryIds.length === 0) {
      setActiveTab(null);
      return;
    }

    selectedCategoryIds.forEach((catId: string) => {
      if (!catId || fetchedCategoryIdsRef.current.has(catId)) return;

      fetchedCategoryIdsRef.current.add(catId);
      setLoadingCategoryIds((prev) => ({ ...prev, [catId]: true }));

      api("category/view", { id: catId })
        .then((res) => {
          if (res && res.status && res.data) {
            const catData = res.data;
            setCategoryDetailsMap((prev) => ({ ...prev, [catId]: catData }));

            const catSpecs = catData.specifications || [];
            const newAssigned: any[] = [];

            catSpecs.forEach((item: any) => {
              const specObj = item.specification || item;
              const specId = specObj._id || specObj.id;
              if (!specId) return;

              const categoryOptions =
                Array.isArray(item.options) && item.options.length > 0
                  ? item.options
                  : Array.isArray(specObj.options)
                  ? specObj.options
                  : [];

              // Check if already in existingCollectionSpecs (e.g. during Edit)
              const matchedColSpec = existingCollectionSpecs.find(
                (cs: any) =>
                  (cs.specification?._id || cs.specification || cs.specificationId) === specId
              );

              let selectedOptionIds: string[] = [];
              if (matchedColSpec) {
                const rawOpts = matchedColSpec.options || matchedColSpec.selectedOptionIds || [];
                selectedOptionIds = rawOpts
                  .map((o: any) => (typeof o === "object" && o !== null ? o._id || o.id : o))
                  .filter(Boolean);
              } else {
                // Default: all options selected
                selectedOptionIds = categoryOptions
                  .map((opt: any) => opt._id || opt.id || "")
                  .filter(Boolean);
              }

              newAssigned.push({
                specificationId: specId,
                specification: specObj,
                availableOptions: categoryOptions,
                selectedOptionIds,
                categoryId: catId,
                categoryName: catData.name || "Category",
              });
            });

            // Merge into assignedSpecifications uniquely by specId + categoryId
            onSpecificationsChange((prevSpecs: any[]) => {
              const existingList = Array.isArray(prevSpecs) ? prevSpecs : [];
              const filtered = existingList.filter(
                (item: any) =>
                  !(item.categoryId === catId && newAssigned.some((na) => na.specificationId === item.specificationId))
              );
              return [...filtered, ...newAssigned];
            });
          }
        })
        .catch((err) => {
          console.error(`Failed to load details for category ${catId}:`, err);
        })
        .finally(() => {
          setLoadingCategoryIds((prev) => ({ ...prev, [catId]: false }));
        });
    });
  }, [selectedCategoryIds, existingCollectionSpecs, onSpecificationsChange]);

  // Ensure active tab points to a valid specification when assignedSpecifications changes
  useEffect(() => {
    if (!Array.isArray(assignedSpecifications) || assignedSpecifications.length === 0) {
      setActiveTab(null);
      return;
    }

    if (activeTab) {
      const stillExists = assignedSpecifications.some(
        (item: any) =>
          item.categoryId === activeTab.categoryId &&
          item.specificationId === activeTab.specificationId
      );
      if (stillExists) return;
    }

    // Default to the first available specification of the first selected category
    const firstSpec = assignedSpecifications.find((item: any) =>
      selectedCategoryIds.includes(item.categoryId)
    );
    if (firstSpec) {
      setActiveTab({
        categoryId: firstSpec.categoryId,
        specificationId: firstSpec.specificationId,
      });
    } else {
      setActiveTab(null);
    }
  }, [assignedSpecifications, selectedCategoryIds, activeTab]);

  // Handle Multi-Select category change
  const handleCategoriesSelectChange = (selectedOptions: any) => {
    const newCatIds: string[] = Array.isArray(selectedOptions)
      ? selectedOptions.map((opt: any) => opt.value).filter(Boolean)
      : [];

    onCategoryIdsChange(newCatIds);

    // Remove specifications belonging to removed categories
    onSpecificationsChange((prevSpecs: any[]) => {
      if (!Array.isArray(prevSpecs)) return [];
      return prevSpecs.filter((item: any) => newCatIds.includes(item.categoryId));
    });
  };

  // Remove a single category
  const handleRemoveCategory = (catIdToRemove: string) => {
    const updatedIds = selectedCategoryIds.filter((id: string) => id !== catIdToRemove);
    onCategoryIdsChange(updatedIds);

    onSpecificationsChange((prevSpecs: any[]) => {
      if (!Array.isArray(prevSpecs)) return [];
      return prevSpecs.filter((item: any) => item.categoryId !== catIdToRemove);
    });
  };

  // Toggle single option
  const handleToggleOption = (specId: string, optionId: string, catId: string) => {
    onSpecificationsChange((prevSpecs: any[]) => {
      if (!Array.isArray(prevSpecs)) return [];
      return prevSpecs.map((item: any) => {
        if (item.specificationId !== specId || item.categoryId !== catId) return item;
        const currentSelected = item.selectedOptionIds || [];
        const exists = currentSelected.includes(optionId);
        const newSelected = exists
          ? currentSelected.filter((id: any) => id !== optionId)
          : [...currentSelected, optionId];
        return {
          ...item,
          selectedOptionIds: newSelected,
        };
      });
    });
  };

  // Select All / Deselect All for a specification
  const handleToggleSelectAll = (specId: string, catId: string) => {
    onSpecificationsChange((prevSpecs: any[]) => {
      if (!Array.isArray(prevSpecs)) return [];
      return prevSpecs.map((item: any) => {
        if (item.specificationId !== specId || item.categoryId !== catId) return item;

        const allOptions = Array.isArray(item.availableOptions)
          ? item.availableOptions
          : Array.isArray(item.specification?.options)
          ? item.specification.options
          : [];

        const allOptionIds = allOptions
          .map((o: any) => o._id || o.id || "")
          .filter(Boolean);

        const currentSelected = item.selectedOptionIds || [];
        const isAllSelected =
          allOptionIds.length > 0 && currentSelected.length === allOptionIds.length;

        return {
          ...item,
          selectedOptionIds: isAllSelected ? [] : allOptionIds,
        };
      });
    });
  };

  // Prepare value for ReactSelect isMulti
  const selectedOptionsValue = categories
    .filter((c: any) => selectedCategoryIds.includes(c._id || c.id))
    .map((c: any) => ({
      value: c._id || c.id,
      label: c.name,
      data: c,
    }));

  // Find active specification item for the right-hand panel
  const activeItem = (Array.isArray(assignedSpecifications) ? assignedSpecifications : []).find(
    (item: any) =>
      item.categoryId === activeTab?.categoryId &&
      item.specificationId === activeTab?.specificationId
  );

  const activeSpec = activeItem?.specification || {};
  const isVariant = Boolean(activeSpec.is_veriant ?? activeSpec.is_variant);
  const activeAllOptions = Array.isArray(activeItem?.availableOptions)
    ? activeItem.availableOptions
    : Array.isArray(activeSpec.options)
    ? activeSpec.options
    : [];
  const activeSelectedIds = activeItem?.selectedOptionIds || [];
  const isAllSelected =
    activeAllOptions.length > 0 && activeSelectedIds.length === activeAllOptions.length;

  return (
    <div className="space-y-3 pt-3 border-t border-slate-200">
      {/* 1. Category Multi-Select */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-900">
            Categories <span className="text-[#B4395A]">*</span>
          </Label>
          {selectedCategoryIds.length > 0 && (
            <span className="text-[11px] font-mono text-slate-500 font-medium">
              {selectedCategoryIds.length} selected
            </span>
          )}
        </div>

        <Select
          isMulti={true}
          placeholder={loadingCategories ? "Loading categories..." : "Select one or more categories..."}
          options={categories.map((c: any) => ({
            value: c._id || c.id,
            label: c.name,
            data: c,
          }))}
          value={selectedOptionsValue}
          isLoading={loadingCategories}
          isSearchable={true}
          isClearable={true}
          onChange={handleCategoriesSelectChange}
        />
      </div>

      {/* 2. Master-Detail Layout: Left Category & Spec Tabs, Right Options */}
      {selectedCategoryIds.length === 0 ? (
        <div className="p-5 text-center rounded-[4px] border border-dashed border-slate-200 bg-slate-50/50 space-y-1">
          <Layers className="w-5 h-5 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-400">
            Select one or more categories above to configure their specifications.
          </p>
        </div>
      ) : (
        <div className="rounded-[4px] border border-slate-200 bg-white overflow-hidden flex flex-col sm:flex-row shadow-2xs min-h-[260px]">
          {/* Left Side: Categories & Specification Tabs */}
          <div className="w-full sm:w-60 md:w-64 border-b sm:border-b-0 sm:border-r border-slate-200 bg-slate-50/60 flex flex-col shrink-0 max-h-[360px] overflow-y-auto">
            <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Categories & Specifications
            </div>

            <div className="divide-y divide-slate-200/80">
              {selectedCategoryIds.map((catId: string) => {
                const categoryObj =
                  categoryDetailsMap[catId] ||
                  categories.find((c: any) => (c._id || c.id) === catId) ||
                  {};
                const catName = categoryObj.name || "Category";
                const isLoadingThisCat = Boolean(loadingCategoryIds[catId]);

                const catSpecs = (Array.isArray(assignedSpecifications) ? assignedSpecifications : []).filter(
                  (item: any) => item.categoryId === catId
                );

                return (
                  <div key={catId} className="flex flex-col">
                    {/* Category Header */}
                    <div className="px-3 py-1.5 bg-slate-100/70 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 truncate" title={catName}>
                        Category: {catName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(catId)}
                        title="Remove category"
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Specifications List under this Category */}
                    <div className="py-1">
                      {isLoadingThisCat ? (
                        <div className="px-3 py-2 text-[11px] text-slate-400 animate-pulse">
                          Loading specs...
                        </div>
                      ) : catSpecs.length === 0 ? (
                        <div className="px-3 py-1.5 text-[11px] text-slate-400 italic">
                          No specifications
                        </div>
                      ) : (
                        catSpecs.map((item: any) => {
                          const spec = item.specification || {};
                          const specIsVariant = Boolean(spec.is_veriant ?? spec.is_variant);
                          const isSelected =
                            activeTab?.categoryId === catId &&
                            activeTab?.specificationId === item.specificationId;

                          const optCount = item.availableOptions?.length || spec.options?.length || 0;
                          const selCount = item.selectedOptionIds?.length || 0;

                          return (
                            <button
                              key={`${catId}_${item.specificationId}`}
                              type="button"
                              onClick={() =>
                                setActiveTab({
                                  categoryId: catId,
                                  specificationId: item.specificationId,
                                })
                              }
                              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors border-l-2 select-none ${
                                isSelected
                                  ? "bg-[#B4395A]/10 border-[#B4395A] text-[#B4395A] font-semibold"
                                  : "border-transparent text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="truncate">{spec.name}</span>
                                {specIsVariant && (
                                  <span className="px-1 py-0.2 bg-purple-100 text-purple-700 text-[9px] font-semibold rounded shrink-0">
                                    Variant
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
                                {selCount}/{optCount}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Direct Option Name and Selection & Select All */}
          <div className="flex-1 p-4 max-h-[360px] overflow-y-auto bg-white flex flex-col">
            {!activeItem ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <Layers className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs">Select a specification from the left to configure options.</p>
              </div>
            ) : activeAllOptions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <p className="text-xs text-slate-400 italic">No options found for this specification.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Top Action: Select All */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">
                    Options ({activeSelectedIds.length} of {activeAllOptions.length} selected)
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      handleToggleSelectAll(activeItem.specificationId, activeItem.categoryId)
                    }
                    className={`group inline-flex items-center gap-2 px-3 py-1 rounded-[4px] border text-xs font-semibold transition-all select-none cursor-pointer ${
                      activeAllOptions.length > 0 && activeSelectedIds.length === activeAllOptions.length
                        ? "bg-rose-50/80 border-[#B4395A] text-[#B4395A]"
                        : "bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-[3px] flex items-center justify-center border transition-colors shrink-0 ${
                        activeAllOptions.length > 0 && activeSelectedIds.length === activeAllOptions.length
                          ? "bg-[#B4395A] border-[#B4395A] text-white"
                          : "border-slate-400 bg-white group-hover:border-slate-500"
                      }`}
                    >
                      {activeAllOptions.length > 0 &&
                        activeSelectedIds.length === activeAllOptions.length && (
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        )}
                    </span>
                    <span className="leading-tight">Select All</span>
                  </button>
                </div>

                {/* Direct Options Selection */}
                <div className="flex flex-wrap gap-2 pt-1">
                    {activeAllOptions.map((opt: any) => {
                      const optId = opt._id || opt.id || "";
                      const isChecked = activeSelectedIds.includes(optId);

                      return (
                        <button
                          type="button"
                          key={optId}
                          onClick={() =>
                            handleToggleOption(activeItem.specificationId, optId, activeItem.categoryId)
                          }
                          className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] border text-xs transition-all select-none cursor-pointer ${
                            isChecked
                              ? "bg-rose-50/70 border-[#B4395A] text-slate-900 shadow-2xs font-semibold"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50/80"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-[3px] flex items-center justify-center border transition-colors shrink-0 ${
                              isChecked
                                ? "bg-[#B4395A] border-[#B4395A] text-white"
                                : "border-slate-300 bg-white group-hover:border-slate-400"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span className="leading-tight">{opt.name}</span>
                        </button>
                      );
                    })}
                  </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
