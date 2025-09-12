import React, { useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search as SearchIcon, Loader2, Check } from "lucide-react";

export default function Search({ mode, selectedMembers = [], setSelectedMembers }) {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState({});

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}user/search?query=${query}`,
        { headers: { Authorization: `Bearer ${user.id}` } }
      );
      setResults(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      setSentRequests(prev => ({ ...prev, [userId]: "sending" }));
      await axios.put(
        `${import.meta.env.VITE_BASE_URL}user/msg-req/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${user.id}` } }
      );
      setSentRequests(prev => ({ ...prev, [userId]: "sent" }));
    } catch (err) {
      setSentRequests(prev => ({ ...prev, [userId]: "error" }));
    }
  };

  const toggleMember = (member) => {
    if (!setSelectedMembers) return;
    setSelectedMembers(prev => {
      const isSelected = prev.find(m => m._id === member._id);
      if (isSelected) {
        return prev.filter(m => m._id !== member._id);
      }
      return [...prev, member];
    });
  };

  const isSelected = (memberId) => {
    return selectedMembers.some(m => m._id === memberId);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by username"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </form>

      {/* Results */}
      {results.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-2">
          {results.map((userData) => (
            <div
              key={userData._id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {userData.name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{userData.name}</div>
                  <div className="text-sm text-gray-500">@{userData.username || 'user'}</div>
                </div>
              </div>

              {mode === "friend" ? (
                <Button
                  onClick={() => sendFriendRequest(userData._id)}
                  disabled={sentRequests[userData._id]}
                  size="sm"
                  variant={sentRequests[userData._id] === "sent" ? "outline" : "default"}
                >
                  {sentRequests[userData._id] === "sending" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : sentRequests[userData._id] === "sent" ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Sent
                    </>
                  ) : (
                    "Add"
                  )}
                </Button>
              ) : (
                <Checkbox
                  checked={isSelected(userData._id)}
                  onCheckedChange={() => toggleMember(userData)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}

      {query && !loading && results.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">No users found</div>
        </div>
      )}
    </div>
  );
}