"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, getCookie } from "@/helper";
import toast from "@/lib/toast";
import {
  Plus,
  Trash2,
  ExternalLink,
  Upload,
  RefreshCw,
  Video,
  Image as ImageIcon,
} from "lucide-react";

// Platform choices
const PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "thread", label: "Threads" },
  { key: "youtube", label: "YouTube" },
  { key: "x", label: "X (Twitter)" },
  { key: "pinterest", label: "Pinterest" },
  { key: "tumblr", label: "Tumblr" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "meesho", label: "Meesho Store" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "snapchat", label: "Snapchat" },
];

export default function SocialMediaManagementPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Grouping Form States: Select Combobox + Input + Plus (+) Button
  const [selectedPlatform, setSelectedPlatform] = useState<string>("instagram");
  const [platformUrlInput, setPlatformUrlInput] = useState<string>("");
  const [savingLink, setSavingLink] = useState(false);

  // Loaded Data from API
  const [linksList, setLinksList] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  // Media Upload States (Only Photo and Video upload, no redirect link, no icons)
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [directMediaUrl, setDirectMediaUrl] = useState("");
  const [addingDirectUrl, setAddingDirectUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch social data from backend
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("social/list", undefined, { method: "GET" });
      if (res && res.status && res.data) {
        const fetchedLinks = res.data.linksList || [];
        setLinksList(fetchedLinks);
        setPosts(res.data.posts || []);

        // Check already added platforms and auto-select first available one
        const addedSet = new Set(
          fetchedLinks
            .filter((l: any) => Boolean(l.url && l.url.trim()))
            .map((l: any) => l.platform)
        );

        setSelectedPlatform((prev) => {
          if (!addedSet.has(prev)) return prev;
          const firstAvailable = PLATFORMS.find((p) => !addedSet.has(p.key));
          return firstAvailable ? firstAvailable.key : "";
        });
      }
    } catch (err: any) {
      console.error("Failed to load social data:", err);
      toast.error("Error", "Failed to fetch social media data from server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Plus (+) Button Action: Save / Set Link for selected platform
  const handleSaveSocialLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedPlatform) {
      toast.error("Validation Error", "Please select a social media platform");
      return;
    }

    const trimmedUrl = platformUrlInput.trim();
    if (!trimmedUrl) {
      toast.error("Validation Error", "Please enter a valid URL");
      return;
    }

    setSavingLink(true);
    try {
      const selectedObj = PLATFORMS.find((p) => p.key === selectedPlatform);
      const res = await api("social/link", {
        platform: selectedPlatform,
        url: trimmedUrl,
        title: selectedObj?.label || selectedPlatform,
        status: "active",
      });

      if (res && res.status) {
        toast.success(
          "Success",
          `${selectedObj?.label || selectedPlatform} link added successfully.`
        );
        setPlatformUrlInput("");
        await fetchData();
      } else {
        toast.error("Failed to Save", res?.message || "Could not save social link");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred");
    } finally {
      setSavingLink(false);
    }
  };

  // Delete social link
  const handleDeleteSocialLink = async (platform: string) => {
    const confirmed = await toast.confirm({
      title: "Are you sure to delete?",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });

    if (!confirmed) return;

    try {
      const res = await api("social/link/delete", { platform });
      if (res && res.status) {
        toast.success("Deleted", "Social media link deleted successfully.");
        await fetchData();
      } else {
        toast.error("Failed", res?.message || "Could not delete link");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "Deletion failed");
    }
  };

  // Handle direct file upload (Video or Photo only)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const mediaType = isVideo ? "video" : "image";

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File Too Large", "File size cannot exceed 50MB");
      return;
    }

    try {
      setUploadingMedia(true);
      toast.info("Uploading", "Uploading media file to server storage...");

      const token =
        getCookie("admin_token") ||
        (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null);

      const queryParams = new URLSearchParams({
        folder: "social",
        fileName: file.name,
      });

      const uploadRes = await fetch(
        `http://localhost:5000/api/admin/upload/direct?${queryParams.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": file.type || (isVideo ? "video/mp4" : "image/jpeg"),
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: file,
        }
      );

      const json = await uploadRes.json();
      if (json && json.status && json.data?.publicUrl) {
        const publicUrl = json.data.publicUrl;

        // Save directly to database
        const saveRes = await api("social/post/create", {
          mediaType,
          mediaUrl: publicUrl,
          caption: "",
          platform: "",
          link: "",
          status: "active",
        });

        if (saveRes && saveRes.status) {
          toast.success("Success", `${isVideo ? "Video" : "Photo"} uploaded successfully.`);
          await fetchData();
        } else {
          toast.error("Error", saveRes?.message || "Failed to save uploaded media.");
        }
      } else {
        toast.error("Upload Failed", json?.message || "Direct upload to storage failed");
      }
    } catch (err: any) {
      console.error("Direct upload error:", err);
      toast.error("Upload Error", err?.message || "Failed to upload file");
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle adding direct video/photo URL
  const handleAddDirectUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = directMediaUrl.trim();
    if (!trimmed) {
      toast.error("Validation Error", "Please enter a valid media URL");
      return;
    }

    const isVideo =
      trimmed.endsWith(".mp4") || trimmed.endsWith(".webm") || trimmed.includes("video");
    const mediaType = isVideo ? "video" : "image";

    setAddingDirectUrl(true);
    try {
      const res = await api("social/post/create", {
        mediaType,
        mediaUrl: trimmed,
        caption: "",
        platform: "",
        link: "",
        status: "active",
      });

      if (res && res.status) {
        toast.success("Success", "Media link added successfully.");
        setDirectMediaUrl("");
        await fetchData();
      } else {
        toast.error("Error", res?.message || "Failed to add media link");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "Operation failed");
    } finally {
      setAddingDirectUrl(false);
    }
  };

  // Delete Media Item
  const handleDeletePost = async (id: string) => {
    const confirmed = await toast.confirm({
      title: "Are you sure to delete?",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });

    if (!confirmed) return;

    try {
      const res = await api("social/post/delete", { id });
      if (res && res.status) {
        toast.success("Deleted", "Media was deleted successfully.");
        setPosts((prev) => prev.filter((p) => p._id !== id));
      } else {
        toast.error("Error", res?.message || "Failed to delete");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "Deletion failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        currentPath="/social"
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area matching other modules */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          title="Social Media"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-8.5 px-3 text-xs border-slate-300 gap-1.5 cursor-pointer bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </Header>

        <main className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* SECTION 1: SOCIAL MEDIA LINKS (COMBOBOX + INPUT + PLUS BUTTON + SIMPLE TABLE) */}
          <div className="rounded-[2px] border border-slate-200 bg-white p-4 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Social Media Links
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select social media from combo box, enter link, and click (+) to add or update.
                </p>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Total Links: <span className="font-bold text-slate-800">{linksList.length}</span>
              </div>
            </div>

            {/* The Grouping: Select Combobox + Input + Plus (+) Button */}
            {(() => {
              const addedPlatformKeys = new Set(
                linksList
                  .filter((l: any) => Boolean(l.url && l.url.trim()))
                  .map((l: any) => l.platform)
              );
              const allPlatformsAdded = PLATFORMS.every((p) => addedPlatformKeys.has(p.key));

              return (
                <form onSubmit={handleSaveSocialLink}>
                  <div className="flex flex-col sm:flex-row items-stretch gap-2">
                    {/* Select Combobox with disabled state for already added platforms */}
                    <div className="sm:w-60 shrink-0">
                      <select
                        id="social-platform-select"
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                        disabled={allPlatformsAdded}
                        className="w-full h-8.5 px-3 text-xs bg-white border border-slate-300 rounded-[2px] focus:outline-none focus:ring-1 focus:ring-[#B4395A] font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {allPlatformsAdded ? (
                          <option value="" disabled>
                            All platforms added
                          </option>
                        ) : (
                          PLATFORMS.map((p) => {
                            const isAdded = addedPlatformKeys.has(p.key);
                            return (
                              <option
                                key={p.key}
                                value={p.key}
                                disabled={isAdded}
                                className={isAdded ? "text-slate-400 bg-slate-50" : "text-slate-800"}
                              >
                                {p.label} {isAdded ? "✓ (Added)" : ""}
                              </option>
                            );
                          })
                        )}
                      </select>
                    </div>

                    {/* URL Input Box */}
                    <div className="flex-1">
                      <Input
                        id="social-link-input"
                        type="url"
                        placeholder={
                          allPlatformsAdded
                            ? "All available social platforms have been added"
                            : "Enter social media URL (e.g. https://www.instagram.com/eclera.cosmetics)"
                        }
                        disabled={allPlatformsAdded}
                        value={platformUrlInput}
                        onChange={(e) => setPlatformUrlInput(e.target.value)}
                        className="h-8.5 text-xs rounded-[2px] border-slate-300 focus-visible:ring-[#B4395A] disabled:bg-slate-50"
                      />
                    </div>

                    {/* Plus (+) Button with Admin Primary Color */}
                    <Button
                      type="submit"
                      disabled={savingLink || allPlatformsAdded || !selectedPlatform}
                      id="social-link-save-button"
                      className="h-8.5 px-4 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c] rounded-[2px] shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                      {savingLink ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                      <span>Set Link</span>
                    </Button>
                  </div>
                </form>
              );
            })()}

            {/* Simple Table Listing */}
            <div className="rounded-[2px] border border-slate-200 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin border-2 border-slate-200 border-t-[#B4395A]" />
                  <p className="text-xs text-slate-500">Loading links...</p>
                </div>
              ) : linksList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No social media links added yet. Select a platform above and click (+) to add.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/60">
                      <TableHead className="w-16 text-center text-xs font-semibold">#</TableHead>
                      <TableHead className="w-48 text-xs font-semibold">Platform</TableHead>
                      <TableHead className="text-xs font-semibold">URL / Link</TableHead>
                      <TableHead className="text-right w-24 text-xs font-semibold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linksList.map((item, idx) => (
                      <TableRow key={item._id || item.platform || idx}>
                        <TableCell className="text-center font-mono text-xs text-slate-500">
                          #{idx + 1}
                        </TableCell>
                        <TableCell className="font-semibold text-xs text-slate-800 capitalize">
                          {item.title || item.platform}
                        </TableCell>
                        <TableCell>
                          {item.url ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#B4395A] hover:underline font-mono inline-flex items-center gap-1.5 truncate max-w-lg"
                              title={item.url}
                            >
                              <span className="truncate">{item.url}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteSocialLink(item.platform)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-[2px] transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* SECTION 2: SOCIAL MEDIA PHOTO & VIDEO REEL UPLOAD (SIMPLE TABLE LISTING) */}
          <div className="rounded-[2px] border border-slate-200 bg-white p-4 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Social Media Photo & Video Upload
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload photos or videos for the website swiper. Click the link in table to view in a new tab.
                </p>
              </div>

              {/* Upload File Input & Button */}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="h-8.5 px-3.5 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c] rounded-[2px] shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingMedia ? "Uploading..." : "Upload Photo / Video"}</span>
                </Button>
              </div>
            </div>

            {/* Direct URL input fallback */}
            <form onSubmit={handleAddDirectUrl}>
              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="Or enter direct video/photo link (e.g. https://...mp4 or image URL)"
                  value={directMediaUrl}
                  onChange={(e) => setDirectMediaUrl(e.target.value)}
                  className="h-8 text-xs rounded-[2px] border-slate-300"
                />
                <Button
                  type="submit"
                  disabled={addingDirectUrl}
                  variant="outline"
                  className="h-8 px-3 text-xs rounded-[2px] border-slate-300 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Link
                </Button>
              </div>
            </form>

            {/* Media Table Listing */}
            <div className="rounded-[2px] border border-slate-200 overflow-hidden">
              {posts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No photos or videos uploaded yet. Click <strong>Upload Photo / Video</strong> above to add.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/60">
                      <TableHead className="w-16 text-center text-xs font-semibold">#</TableHead>
                      <TableHead className="w-24 text-xs font-semibold">Type</TableHead>
                      <TableHead className="w-20 text-center text-xs font-semibold">Preview</TableHead>
                      <TableHead className="text-xs font-semibold">Media Link (Click to view in new tab)</TableHead>
                      <TableHead className="text-right w-24 text-xs font-semibold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post, idx) => {
                      const isVideo =
                        post.mediaType === "video" ||
                        post.mediaUrl?.endsWith(".mp4") ||
                        post.mediaUrl?.endsWith(".webm");

                      return (
                        <TableRow key={post._id || idx}>
                          <TableCell className="text-center font-mono text-xs text-slate-500">
                            #{idx + 1}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[2px] ${
                                isVideo
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {isVideo ? (
                                <Video className="w-3 h-3" />
                              ) : (
                                <ImageIcon className="w-3 h-3" />
                              )}
                              <span>{isVideo ? "Video" : "Photo"}</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="h-10 w-10 mx-auto rounded-[2px] overflow-hidden bg-slate-900 flex items-center justify-center">
                              {isVideo ? (
                                <video
                                  src={post.mediaUrl}
                                  muted
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <img
                                  src={post.mediaUrl}
                                  alt="Preview"
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <a
                              href={post.mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#B4395A] hover:underline font-mono inline-flex items-center gap-1.5 max-w-xl truncate"
                              title="Click to open and view in new tab"
                            >
                              <span className="truncate">{post.mediaUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                            </a>
                          </TableCell>
                          <TableCell className="text-right">
                            <button
                              type="button"
                              onClick={() => handleDeletePost(post._id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-[2px] transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
