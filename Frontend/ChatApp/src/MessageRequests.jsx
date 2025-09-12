import { useUser } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export default function MessageRequests() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Fetch message requests
  const { data: requests = [], isLoading, isError } = useQuery({
    queryKey: ["msgRequests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}user/msg-reqs`, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      return res.data.data || [];
    },
    enabled: !!user,
  });

  // Accept/Reject mutation
  const mutation = useMutation({
    mutationFn: async ({ requestId, type }) => {
      return await axios.put(
        `${import.meta.env.VITE_BASE_URL}user/${type}/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${user.id}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["msgRequests", user.id] });
    },
  });

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Message Requests</h2>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="animate-pulse bg-gray-100 rounded-2xl p-4 shadow-sm"
            >
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-8">
          <p className="text-red-600 font-medium">
            Failed to load message requests. Please try again later.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && requests.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 font-medium">No message requests found.</p>
        </div>
      )}

      {/* Requests List */}
      {!isLoading && !isError && requests.length > 0 && (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Card
              key={req._id}
              className="shadow-lg rounded-2xl transition-transform hover:shadow-xl"
              role="region"
              aria-labelledby={`request-${req._id}`}
            >
              <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Request Details */}
                <div className="flex-1">
                  <h3
                    id={`request-${req._id}`}
                    className="text-lg font-semibold text-gray-800"
                  >
                    {req.name || "Unknown"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {req.message || "No message provided"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Sent: {new Date(req.sentAt).toLocaleString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    className="flex-1 md:flex-none bg-green-600 text-white rounded-xl hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                    onClick={() =>
                      mutation.mutate({ requestId: req._id, type: "accept" })
                    }
                    disabled={mutation.isLoading}
                    aria-label={`Accept request from ${req.name || "Unknown"}`}
                  >
                    Accept
                  </Button>
                  <Button
                    className="flex-1 md:flex-none bg-red-600 text-white rounded-xl hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                    onClick={() =>
                      mutation.mutate({ requestId: req._id, type: "reject" })
                    }
                    disabled={mutation.isLoading}
                    aria-label={`Reject request from ${req.name || "Unknown"}`}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}