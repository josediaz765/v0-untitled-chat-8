"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Zap, CheckCircle, XCircle, Clock } from "lucide-react"

interface ExecutionAnalyticsProps {
  apiKey: string
  isDarkMode: boolean
}

export function ExecutionAnalytics({ apiKey, isDarkMode }: ExecutionAnalyticsProps) {
  const [executionStats, setExecutionStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    successRate: 0,
    todayExecutions: 0,
    recentExecutions: [],
  })

  const fetchExecutionStats = async () => {
    if (!apiKey) return

    try {
      const response = await fetch(`/api/execution-log?apiKey=${apiKey}`)

      if (!response.ok) {
        console.error("Execution stats response not ok:", response.status)
        return
      }

      const data = await response.json()

      if (data.success && data.stats) {
        setExecutionStats({
          total: data.stats.total || 0,
          successful: data.stats.successful || 0,
          failed: data.stats.failed || 0,
          successRate: data.stats.successRate || 0,
          todayExecutions: data.stats.todayExecutions || 0,
          recentExecutions: Array.isArray(data.logs) ? data.logs.slice(0, 5) : [],
        })
      }
    } catch (error) {
      console.error("Failed to fetch execution stats:", error)
      // Reset to default values on error
      setExecutionStats({
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        todayExecutions: 0,
        recentExecutions: [],
      })
    }
  }

  useEffect(() => {
    if (apiKey) {
      fetchExecutionStats()

      // Refresh every 30 seconds
      const interval = setInterval(fetchExecutionStats, 30000)
      return () => clearInterval(interval)
    }
  }, [apiKey])

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card
        className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
      >
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
            <BarChart3 className="h-5 w-5" />
            Execution Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Total Executions</span>
              <Badge variant="secondary">{executionStats.total}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Today</span>
              <Badge variant="outline">{executionStats.todayExecutions}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Success Rate</span>
              <Badge variant={executionStats.successRate > 80 ? "default" : "destructive"}>
                {executionStats.successRate}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
      >
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
            <TrendingUp className="h-5 w-5" />
            Success Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Successful</span>
              </div>
              <span className={`font-medium ${isDarkMode ? "text-white" : ""}`}>{executionStats.successful}</span>
            </div>
            <Progress value={(executionStats.successful / Math.max(executionStats.total, 1)) * 100} className="h-2" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Failed</span>
              </div>
              <span className={`font-medium ${isDarkMode ? "text-white" : ""}`}>{executionStats.failed}</span>
            </div>
            <Progress value={(executionStats.failed / Math.max(executionStats.total, 1)) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card
        className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
      >
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {executionStats.recentExecutions && executionStats.recentExecutions.length === 0 ? (
              <div className="text-center py-4">
                <Zap className={`h-8 w-8 mx-auto mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>No recent executions</p>
              </div>
            ) : (
              executionStats.recentExecutions.slice(0, 3).map((execution: any, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-2 rounded ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${execution.execution_status === "executed" ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <div className="flex-1">
                    <p className={`text-sm ${isDarkMode ? "text-white" : ""}`}>
                      {execution.execution_status === "executed" ? "Success" : "Failed"}
                    </p>
                    <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {new Date(execution.created_at).toLocaleTimeString()}
                    </p>
                    {execution.executed_by_player && (
                      <p className={`text-xs ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                        By: {execution.executed_by_player}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
