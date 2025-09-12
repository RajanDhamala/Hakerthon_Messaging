import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Users, UserPlus, Loader2 } from "lucide-react";
import Search from "./Search";
import axios from "axios";

export default function CreateGroup({ onClose }) {
  const { user } = useUser();
  const [mode, setMode] = useState("friend");
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;

    setLoading(true);
    setError("");

    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}group/create`,
        { 
          name: groupName, 
          members: [user.id, ...selectedMembers.map(m => m._id)] 
        },
        { headers: { Authorization: `Bearer ${user.id}` } }
      );
      onClose?.();
    } catch (err) {
      setError("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[480px] bg-white rounded-lg shadow-xl border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-medium">New Chat</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setMode("friend")}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
            mode === "friend" 
              ? "border-blue-500 text-blue-600" 
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <UserPlus className="w-4 h-4 inline mr-2" />
          Add Friend
        </button>
        <button
          onClick={() => setMode("group")}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
            mode === "group" 
              ? "border-blue-500 text-blue-600" 
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          New Group
        </button>
      </div>

      <div className="p-4">
        {/* Group Name Input */}
        {mode === "group" && (
          <div className="mb-4">
            <Input
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full"
            />
            {selectedMembers.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                <span className="text-gray-600">Members: </span>
                {selectedMembers.map((m, i) => (
                  <span key={m._id}>
                    {m.name}{i < selectedMembers.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Search */}
        <Search
          mode={mode}
          selectedMembers={selectedMembers}
          setSelectedMembers={setSelectedMembers}
        />

        {/* Create Group Button */}
        {mode === "group" && (
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={createGroup}
              disabled={loading || !groupName.trim() || selectedMembers.length === 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                `Create Group (${selectedMembers.length + 1})`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}