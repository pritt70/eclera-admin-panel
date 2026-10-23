"use client";

import React, { useState, useEffect } from "react";
import { Check, Layers, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/select";

export function CategorySpecificationPicker({
  availableSpecifications = [],
  assignedSpecifications = [],
  onChange,
  loading = false,
}: any) {
  const [activeSpecId, setActiveSpecId] = useState<string | null>(null);

  const assignedIdSet = new Set(
    (assignedSpecifications || []).map((a: any) => a.specificationId)
  );

  // Sync active specification tab
  useEffect(() => {
    if (!Array.isArray(assignedSpecifications) || assignedSpecifications.length === 0) {
      setActiveSpecId(null);
      return;
    }

    if (activeSpecId) {
      const stillExists = assignedSpecifications.some(
        (item: any) => item.specificationId === activeSpecId
      );
      if (stillExists) return;
    }

    // Default to the first specification
    setActiveSpecId(assignedSpecifications[0]?.specificationId || null);
  }, [assignedSpecifications, activeSpecId]);

  const handleSelectSpecification = (spec: any) => {
    if (assignedIdSet.has(spec._id)) {
      setActiveSpecId(spec._id);
      return;
    }

    const specOptions = Array.isArray(spec.options) ? spec.options : [];
    // Default: select all options of this specification initially
    const initialOptionIds = specOptions.map((opt: any) => opt._id || opt.id || "");

    const newAssigned = {
      specificationId: spec._id,
      specification: spec,
      selectedOptionIds: initialOptionIds.filter(Boolean),
    };

    onChange([...assignedSpecifications, newAssigned]);
    setActiveSpecId(spec._id);
  };

  const handleRemoveSpecification = (specId: string) => {
    const updated = assignedSpecifications.filter((a: any) => a.specificationId !== specId);
    onChange(updated);
    if (activeSpecId === specId) {
      const nextSpec = updated[0];
      setActiveSpecId(nextSpec ? nextSpec.specificationId : null);
    }
  };

  const handleToggleOption = (specId: string, optionId: string) => {
    onChange(
      assignedSpecifications.map((item: any) => {
        if (item.specificationId !== specId) return item;
        const currentSelected = item.selectedOptionIds || [];
        const exists = currentSelected.includes(optionId);
        const newOptions = exists
          ? currentSelected.filter((id: any) => id !== optionId)
          : [...currentSelected, optionId];
        return {
          ...item,
          selectedOptionIds: newOptions,
        };
      })
    );
  };

  const handleToggleSelectAll = (specId: string) => {
    onChange(
      assignedSpecifications.map((item: any) => {
        if (item.specificationId !== specId) return item;

        const spec = item.specification || {};
        const allOptions = Array.isArray(spec.options) ? spec.options : [];
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
      })
    );
  };

  // Find currently active specification item
  const activeItem = (Array.isArray(assignedSpecifications) ? assignedSpecifications : []).find(
    (item: any) => item.specificationId === activeSpecId
  );
  const activeSpec = activeItem?.specification || {};
  const activeAllOptions = Array.isArray(activeSpec.options) ? activeSpec.options : [];
  const activeSelectedIds = activeItem?.selectedOptionIds || [];
  const isAllSelected =
    activeAllOptions.length > 0 && activeSelectedIds.length === activeAllOptions.length;

  return (
    <div className="space-y-3 pt-3 border-t border-slate-200">
      {/* 1. Header & Count */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-900">
          Specification
        </Label>
        {assignedSpecifications.length > 0 && (
          <span className="text-[11px] font-mono text-slate-500 font-medium">
            {assignedSpecifications.length} selected
          </span>
        )}
      </div>

      {/* 2. Search Select Dropdown */}
      <div>
        <Select
          placeholder={loading ? "Loading specifications..." : "Select specification to add..."}
          options={availableSpecifications.map((spec: any) => ({
            value: spec._id,
            label: spec.name,
            data: spec,
          }))}
          value={null}
          isLoading={loading}
          isSearchable={true}
          isClearable={false}
          isOptionDisabled={(option: any) => assignedIdSet.has(option.value)}
          onChange={(selected: any) => {
            if (selected?.data) {
              handleSelectSpecification(selected.data);
            }
          }}
        />
      </div>

      {/* 3. Master-Detail Layout: Left Specification Tabs, Right Options */}
      {assignedSpecifications.length === 0 ? (
        <div className="p-5 text-center rounded-[4px] border border-dashed border-slate-200 bg-slate-50/50 space-y-1">
          <Layers className="w-5 h-5 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-400">
            Select a specification above to configure options.
          </p>
        </div>
      ) : (
        <div className="rounded-[4px] border border-slate-200 bg-white overflow-hidden flex flex-col sm:flex-row shadow-2xs min-h-[260px]">
          {/* Left Side: Specification Tabs */}
          <div className="w-full sm:w-56 md:w-60 border-b sm:border-b-0 sm:border-r border-slate-200 bg-slate-50/60 flex flex-col shrink-0 max-h-[360px] overflow-y-auto">
            <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Specifications</span>
              <span className="text-[10px] font-mono font-semibold text-slate-500">
                {assignedSpecifications.length}
              </span>
            </div>

            <div className="divide-y divide-slate-200/80">
              {assignedSpecifications.map((item: any) => {
                const spec = item.specification || {};
                const specIsVariant = Boolean(spec.is_veriant ?? spec.is_variant);
                const isSelected = activeSpecId === item.specificationId;

                const allOptions = Array.isArray(spec.options) ? spec.options : [];
                const optCount = allOptions.length;
                const selCount = item.selectedOptionIds?.length || 0;

                return (
                  <button
                    key={item.specificationId}
                    type="button"
                    onClick={() => setActiveSpecId(item.specificationId)}
                    className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between transition-colors border-l-2 select-none group cursor-pointer ${
                      isSelected
                        ? "bg-[#B4395A]/10 border-[#B4395A] text-[#B4395A] font-semibold"
                        : "border-transparent text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                      <span className="truncate" title={spec.name}>
                        {spec.name}
                      </span>
                      {specIsVariant && (
                        <span className="px-1 py-0.2 bg-purple-100 text-purple-700 text-[9px] font-semibold rounded shrink-0">
                          Variant
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className="text-[10px] font-mono text-slate-400">
                        {selCount}/{optCount}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSpecification(item.specificationId);
                        }}
                        title="Remove specification"
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side: Options and Select All */}
          <div className="flex-1 p-4 max-h-[360px] overflow-y-auto bg-white flex flex-col">
            {!activeItem ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <Layers className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs">Select a specification from the left to configure options.</p>
              </div>
            ) : activeAllOptions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <p className="text-xs text-slate-400 italic">
                  No options found for this specification.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Top Action Bar: Select All Button */}
                <div className="flex items-center justify-end pb-2.5 border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(activeItem.specificationId)}
                    className={`group inline-flex items-center gap-2 px-3 py-1 rounded-[4px] border text-xs font-semibold transition-all select-none cursor-pointer ${
                      isAllSelected
                        ? "bg-rose-50/80 border-[#B4395A] text-[#B4395A]"
                        : "bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-[3px] flex items-center justify-center border transition-colors shrink-0 ${
                        isAllSelected
                          ? "bg-[#B4395A] border-[#B4395A] text-white"
                          : "border-slate-400 bg-white group-hover:border-slate-500"
                      }`}
                    >
                      {isAllSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
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
                          handleToggleOption(activeItem.specificationId, optId)
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
