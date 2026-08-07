import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card.jsx";
import { Badge } from "./ui/Badge.jsx";

export default function AdminDashboard({ stats }) {
  return (
    <div className="dashboard-shell space-y-8">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <Badge variant="accent">Admin dashboard</Badge>
              <CardTitle>Knowledge base control center</CardTitle>
              <CardDescription>
                Upload documents, monitor usage, and keep your staff knowledge assistant current.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-[0.18em]">Total documents</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{stats.totalDocuments}</p>
            <p className="mt-3 text-sm text-slate-600">Indexed documents available to staff chat.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-[0.18em]">Total chunks</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{stats.totalChunks}</p>
            <p className="mt-3 text-sm text-slate-600">Chunks created to improve relevancy and retrieval.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-[0.18em]">Chat requests</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{stats.totalChats}</p>
            <p className="mt-3 text-sm text-slate-600">Total staff queries against your knowledge base.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Recent uploads</CardTitle>
            <CardDescription>Latest documents added to the system.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.recentUploads.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              No uploads yet. Use the sidebar to add files or paste text.
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentUploads.map((doc) => (
                <div
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
                  key={doc._id}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-950">{doc.title}</p>
                      <p className="text-sm text-slate-600">{doc.category.replace(/_/g, " ")}</p>
                    </div>
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
