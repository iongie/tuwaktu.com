package repository

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"gorm.io/gorm"
	"tuwaktu.com/internal/domain"
)

type PostgresAnalyticsRepository struct {
	db *gorm.DB
}

func NewPostgresAnalyticsRepository(db *gorm.DB) *PostgresAnalyticsRepository {
	return &PostgresAnalyticsRepository{db: db}
}

// RecordEvent mencatat entri telemetri interaksi ke database
func (r *PostgresAnalyticsRepository) RecordEvent(ctx context.Context, event *domain.AnalyticsEvent) error {
	return r.db.WithContext(ctx).Create(event).Error
}

// GetSummary menghitung agregasi metrik analitik platform untuk panel admin
func (r *PostgresAnalyticsRepository) GetSummary(ctx context.Context, days int) (*domain.AdminAnalyticsSummary, error) {
	summary := &domain.AdminAnalyticsSummary{
		BookingStatusBreakdown: make(map[string]int64),
		TopWorkers:             []domain.AnalyticsWorkerMetric{},
		TopSearches:            []domain.AnalyticsSearchMetric{},
		TopCities:              []domain.AnalyticsCityMetric{},
		DaysRange:              days,
	}

	useTimeFilter := days > 0
	var cutoff time.Time
	if useTimeFilter {
		cutoff = time.Now().AddDate(0, 0, -days)
	}

	// 1. Total WhatsApp Clicks
	qWA := r.db.WithContext(ctx).Model(&domain.AnalyticsEvent{}).Where("event_name = ?", domain.EventWhatsAppClick)
	if useTimeFilter {
		qWA = qWA.Where("created_at >= ?", cutoff)
	}
	if err := qWA.Count(&summary.TotalWhatsAppClicks).Error; err != nil {
		return nil, err
	}

	// 2. Total Profile Views
	qViews := r.db.WithContext(ctx).Model(&domain.AnalyticsEvent{}).Where("event_name = ?", domain.EventPageViewWorker)
	if useTimeFilter {
		qViews = qViews.Where("created_at >= ?", cutoff)
	}
	if err := qViews.Count(&summary.TotalProfileViews).Error; err != nil {
		return nil, err
	}

	// 3. Total Searches Performed
	qSearches := r.db.WithContext(ctx).Model(&domain.AnalyticsEvent{}).Where("event_name = ?", domain.EventSearchPerformed)
	if useTimeFilter {
		qSearches = qSearches.Where("created_at >= ?", cutoff)
	}
	if err := qSearches.Count(&summary.TotalSearches).Error; err != nil {
		return nil, err
	}

	// 4. Total Bookings & Status Breakdown
	qBookings := r.db.WithContext(ctx).Model(&domain.Booking{})
	if useTimeFilter {
		qBookings = qBookings.Where("created_at >= ?", cutoff)
	}
	if err := qBookings.Count(&summary.TotalBookings).Error; err != nil {
		return nil, err
	}

	type statusRow struct {
		Status string
		Count  int64
	}
	var statusRows []statusRow
	qStatus := r.db.WithContext(ctx).Model(&domain.Booking{}).Select("status, count(*) as count")
	if useTimeFilter {
		qStatus = qStatus.Where("created_at >= ?", cutoff)
	}
	if err := qStatus.Group("status").Scan(&statusRows).Error; err == nil {
		for _, row := range statusRows {
			summary.BookingStatusBreakdown[row.Status] = row.Count
		}
	}

	// 5. Top 5 Workers paling diminati
	type workerClickRow struct {
		Identifier string `gorm:"column:identifier"`
		Clicks     int64  `gorm:"column:clicks"`
	}
	var clickRows []workerClickRow
	qTopWA := r.db.WithContext(ctx).Model(&domain.AnalyticsEvent{}).
		Select("entity_id as identifier, count(*) as clicks").
		Where("event_name = ? AND entity_id IS NOT NULL AND entity_id != ''", domain.EventWhatsAppClick)
	if useTimeFilter {
		qTopWA = qTopWA.Where("created_at >= ?", cutoff)
	}
	_ = qTopWA.Group("entity_id").Order("clicks DESC").Limit(5).Scan(&clickRows).Error

	// Ambil profil pekerja untuk top clicks
	for _, row := range clickRows {
		var w domain.Worker
		// Cari pekerja berdasarkan slug atau ID
		err := r.db.WithContext(ctx).Where("slug = ? OR id::text = ?", row.Identifier, row.Identifier).First(&w).Error
		if err == nil {
			// Hitung juga total views pekerja ini
			var pViews int64
			qPV := r.db.WithContext(ctx).Model(&domain.AnalyticsEvent{}).
				Where("event_name = ? AND entity_id = ?", domain.EventPageViewWorker, row.Identifier)
			if useTimeFilter {
				qPV = qPV.Where("created_at >= ?", cutoff)
			}
			_ = qPV.Count(&pViews).Error

			summary.TopWorkers = append(summary.TopWorkers, domain.AnalyticsWorkerMetric{
				WorkerID:       w.ID,
				WorkerSlug:     w.Slug,
				WorkerName:     w.Name,
				Zone:           w.Zone,
				WhatsAppClicks: row.Clicks,
				ProfileViews:   pViews,
			})
		}
	}

	// Jika belum ada klik WA, tampilkan top workers berdasarkan rating/order standar
	if len(summary.TopWorkers) == 0 {
		var defaultWorkers []domain.Worker
		if err := r.db.WithContext(ctx).Where("is_active = true").Order("rating DESC").Limit(5).Find(&defaultWorkers).Error; err == nil {
			for _, w := range defaultWorkers {
				var pViews int64
				qPV := r.db.WithContext(ctx).Model(&domain.AnalyticsEvent{}).
					Where("event_name = ? AND (entity_id = ? OR entity_id = ?)", domain.EventPageViewWorker, w.Slug, w.ID)
				if useTimeFilter {
					qPV = qPV.Where("created_at >= ?", cutoff)
				}
				_ = qPV.Count(&pViews).Error

				summary.TopWorkers = append(summary.TopWorkers, domain.AnalyticsWorkerMetric{
					WorkerID:       w.ID,
					WorkerSlug:     w.Slug,
					WorkerName:     w.Name,
					Zone:           w.Zone,
					WhatsAppClicks: 0,
					ProfileViews:   pViews,
				})
			}
		}
	}

	// 6. Top Searches
	var searchEvents []domain.AnalyticsEvent
	qTopSearches := r.db.WithContext(ctx).Where("event_name = ?", domain.EventSearchPerformed)
	if useTimeFilter {
		qTopSearches = qTopSearches.Where("created_at >= ?", cutoff)
	}
	if err := qTopSearches.Order("created_at DESC").Limit(100).Find(&searchEvents).Error; err == nil {
		searchCounts := make(map[string]map[string]int64)
		for _, ev := range searchEvents {
			if strings.TrimSpace(ev.Metadata) != "" {
				var meta map[string]interface{}
				if json.Unmarshal([]byte(ev.Metadata), &meta) == nil {
					qStr, _ := meta["query"].(string)
					locStr, _ := meta["location"].(string)
					qStr = strings.TrimSpace(qStr)
					locStr = strings.TrimSpace(locStr)

					if qStr != "" || locStr != "" {
						key := strings.ToLower(qStr) + "|||" + strings.ToLower(locStr)
						if searchCounts[key] == nil {
							searchCounts[key] = map[string]int64{"count": 0}
						}
						searchCounts[key]["count"]++
					}
				}
			}
		}

		type aggregatedSearch struct {
			query    string
			location string
			count    int64
		}
		var aggList []aggregatedSearch
		for k, v := range searchCounts {
			parts := strings.Split(k, "|||")
			aggList = append(aggList, aggregatedSearch{
				query:    parts[0],
				location: parts[1],
				count:    v["count"],
			})
		}

		// Sort desc
		for i := 0; i < len(aggList)-1; i++ {
			for j := i + 1; j < len(aggList); j++ {
				if aggList[j].count > aggList[i].count {
					aggList[i], aggList[j] = aggList[j], aggList[i]
				}
			}
		}

		for idx, item := range aggList {
			if idx >= 5 {
				break
			}
			summary.TopSearches = append(summary.TopSearches, domain.AnalyticsSearchMetric{
				Query:    item.query,
				Location: item.location,
				Count:    item.count,
			})
		}
	}

	// 7. Top Cities (Distribusi Geografis Pengguna ala Umami)
	var cityEvents []domain.AnalyticsEvent
	qCities := r.db.WithContext(ctx).Model(&domain.AnalyticsEvent{}).
		Where("metadata IS NOT NULL AND metadata != '' AND metadata != '{}'")
	if useTimeFilter {
		qCities = qCities.Where("created_at >= ?", cutoff)
	}

	if err := qCities.Order("created_at DESC").Limit(500).Find(&cityEvents).Error; err == nil {
		type cityStat struct {
			totalActivity  int64
			profileViews   int64
			searches       int64
			whatsappClicks int64
		}
		cityMap := make(map[string]*cityStat)
		var totalAllCitiesActivity int64

		for _, ev := range cityEvents {
			var meta map[string]interface{}
			if err := json.Unmarshal([]byte(ev.Metadata), &meta); err == nil && meta != nil {
				cityName := ""
				if c, ok := meta["city"].(string); ok && strings.TrimSpace(c) != "" {
					cityName = strings.TrimSpace(c)
				} else if loc, ok := meta["location"].(string); ok && strings.TrimSpace(loc) != "" {
					cityName = strings.TrimSpace(loc)
				}

				if cityName != "" {
					cityName = strings.TrimSpace(cityName)
					stat := cityMap[cityName]
					if stat == nil {
						stat = &cityStat{}
						cityMap[cityName] = stat
					}

					stat.totalActivity++
					totalAllCitiesActivity++

					switch ev.EventName {
					case domain.EventPageViewWorker:
						stat.profileViews++
					case domain.EventSearchPerformed:
						stat.searches++
					case domain.EventWhatsAppClick:
						stat.whatsappClicks++
					}
				}
			}
		}

		type cityEntry struct {
			name string
			stat *cityStat
		}
		var cityList []cityEntry
		for name, stat := range cityMap {
			cityList = append(cityList, cityEntry{name: name, stat: stat})
		}

		// Sortir berdasarkan totalActivity descending
		for i := 0; i < len(cityList)-1; i++ {
			for j := i + 1; j < len(cityList); j++ {
				if cityList[j].stat.totalActivity > cityList[i].stat.totalActivity {
					cityList[i], cityList[j] = cityList[j], cityList[i]
				}
			}
		}

		for idx, item := range cityList {
			if idx >= 8 {
				break
			}
			pct := 0.0
			if totalAllCitiesActivity > 0 {
				pct = float64(item.stat.totalActivity) / float64(totalAllCitiesActivity) * 100
				pct = float64(int(pct*10+0.5)) / 10.0
			}

			summary.TopCities = append(summary.TopCities, domain.AnalyticsCityMetric{
				City:           item.name,
				TotalActivity:  item.stat.totalActivity,
				ProfileViews:   item.stat.profileViews,
				Searches:       item.stat.searches,
				WhatsAppClicks: item.stat.whatsappClicks,
				Percentage:     pct,
			})
		}
	}

	return summary, nil
}

