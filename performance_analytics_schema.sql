-- Performance Analytics Database Schema
-- Run this in your Supabase SQL Editor to create performance tracking tables

-- 1. Create performance_metrics table to store Speed Insights data
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    timestamp timestamptz NOT NULL DEFAULT NOW(),
    page varchar(500) NOT NULL,
    lcp decimal(10,3) DEFAULT 0, -- Largest Contentful Paint in seconds
    fid decimal(10,3) DEFAULT 0, -- First Input Delay in milliseconds
    cls decimal(10,6) DEFAULT 0, -- Cumulative Layout Shift
    ttfb decimal(10,3) DEFAULT 0, -- Time to First Byte in milliseconds
    user_agent text,
    connection_type varchar(50),
    device_type varchar(50),
    country varchar(10),
    created_at timestamptz DEFAULT NOW()
);

-- 2. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_page ON performance_metrics(page);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);

-- 3. Create view for daily performance summary
CREATE OR REPLACE VIEW daily_performance_stats AS
SELECT 
    DATE(created_at) as date,
    page,
    COUNT(*) as total_views,
    AVG(lcp) as avg_lcp,
    AVG(fid) as avg_fid,
    AVG(cls) as avg_cls,
    AVG(ttfb) as avg_ttfb,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY lcp) as p75_lcp,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY lcp) as p95_lcp
FROM performance_metrics
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), page
ORDER BY date DESC, page;

-- 4. Create function to get performance analytics
CREATE OR REPLACE FUNCTION get_performance_analytics(days_back integer DEFAULT 30)
RETURNS json AS $$
DECLARE
    result json;
    overall_stats json;
    page_stats json;
BEGIN
    -- Calculate overall performance statistics
    SELECT json_build_object(
        'totalViews', COUNT(*),
        'averageLCP', ROUND(AVG(lcp), 3),
        'averageFID', ROUND(AVG(fid), 2),
        'averageCLS', ROUND(AVG(cls), 6),
        'averageTTFB', ROUND(AVG(ttfb), 2),
        'performanceScore', ROUND(
            (CASE WHEN AVG(lcp) <= 2.5 THEN 25 WHEN AVG(lcp) <= 4.0 THEN 15 ELSE 5 END) +
            (CASE WHEN AVG(fid) <= 100 THEN 25 WHEN AVG(fid) <= 300 THEN 15 ELSE 5 END) +
            (CASE WHEN AVG(cls) <= 0.1 THEN 25 WHEN AVG(cls) <= 0.25 THEN 15 ELSE 5 END) +
            (CASE WHEN AVG(ttfb) <= 800 THEN 25 WHEN AVG(ttfb) <= 1800 THEN 15 ELSE 5 END)
        )
    ) INTO overall_stats
    FROM performance_metrics
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back;
    
    -- Calculate per-page statistics
    SELECT json_agg(
        json_build_object(
            'path', page,
            'visits', total_views,
            'lcp', ROUND(avg_lcp, 3),
            'fid', ROUND(avg_fid, 2),
            'cls', ROUND(avg_cls, 6),
            'ttfb', ROUND(avg_ttfb, 2),
            'performanceScore', ROUND(
                (CASE WHEN avg_lcp <= 2.5 THEN 25 WHEN avg_lcp <= 4.0 THEN 15 ELSE 5 END) +
                (CASE WHEN avg_fid <= 100 THEN 25 WHEN avg_fid <= 300 THEN 15 ELSE 5 END) +
                (CASE WHEN avg_cls <= 0.1 THEN 25 WHEN avg_cls <= 0.25 THEN 15 ELSE 5 END) +
                (CASE WHEN avg_ttfb <= 800 THEN 25 WHEN avg_ttfb <= 1800 THEN 15 ELSE 5 END)
            )
        )
    ) INTO page_stats
    FROM (
        SELECT 
            page,
            COUNT(*) as total_views,
            AVG(lcp) as avg_lcp,
            AVG(fid) as avg_fid,
            AVG(cls) as avg_cls,
            AVG(ttfb) as avg_ttfb
        FROM performance_metrics
        WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
        GROUP BY page
        ORDER BY COUNT(*) DESC
    ) page_metrics;
    
    -- Build final result
    result := json_build_object(
        'overall', COALESCE(overall_stats, '{"totalViews":0,"averageLCP":0,"averageFID":0,"averageCLS":0,"averageTTFB":0,"performanceScore":0}'::json),
        'pages', COALESCE(page_stats, '[]'::json),
        'generatedAt', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to get Core Web Vitals summary
CREATE OR REPLACE FUNCTION get_core_web_vitals()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'lcp', json_build_object(
            'name', 'Largest Contentful Paint (LCP)',
            'value', ROUND(AVG(lcp), 3),
            'unit', 's',
            'status', CASE 
                WHEN AVG(lcp) <= 2.5 THEN 'good'
                WHEN AVG(lcp) <= 4.0 THEN 'needs-improvement'
                ELSE 'poor'
            END,
            'threshold', json_build_object('good', 2.5, 'poor', 4.0)
        ),
        'fid', json_build_object(
            'name', 'First Input Delay (FID)',
            'value', ROUND(AVG(fid), 2),
            'unit', 'ms',
            'status', CASE 
                WHEN AVG(fid) <= 100 THEN 'good'
                WHEN AVG(fid) <= 300 THEN 'needs-improvement'
                ELSE 'poor'
            END,
            'threshold', json_build_object('good', 100, 'poor', 300)
        ),
        'cls', json_build_object(
            'name', 'Cumulative Layout Shift (CLS)',
            'value', ROUND(AVG(cls), 6),
            'unit', '',
            'status', CASE 
                WHEN AVG(cls) <= 0.1 THEN 'good'
                WHEN AVG(cls) <= 0.25 THEN 'needs-improvement'
                ELSE 'poor'
            END,
            'threshold', json_build_object('good', 0.1, 'poor', 0.25)
        ),
        'ttfb', json_build_object(
            'name', 'Time to First Byte (TTFB)',
            'value', ROUND(AVG(ttfb), 2),
            'unit', 'ms',
            'status', CASE 
                WHEN AVG(ttfb) <= 800 THEN 'good'
                WHEN AVG(ttfb) <= 1800 THEN 'needs-improvement'
                ELSE 'poor'
            END,
            'threshold', json_build_object('good', 800, 'poor', 1800)
        )
    ) INTO result
    FROM performance_metrics
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
    
    RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create RLS policies (adjust based on your authentication setup)
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for performance tracking (from web app)
CREATE POLICY "Allow anonymous performance tracking" ON performance_metrics
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- Allow authenticated users to read their own performance data
CREATE POLICY "Allow authenticated read access" ON performance_metrics
    FOR SELECT
    TO authenticated
    USING (true);

-- 7. Grant necessary permissions
GRANT INSERT ON performance_metrics TO anon;
GRANT SELECT ON performance_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_analytics(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_core_web_vitals() TO authenticated;

-- 8. Test the functions
-- SELECT get_performance_analytics(30);
-- SELECT get_core_web_vitals();