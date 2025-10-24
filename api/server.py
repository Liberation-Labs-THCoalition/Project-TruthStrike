#!/usr/bin/env python3
"""
TruthStrike Pattern Update Server
Local API for updating disinformation patterns without redeploying extension
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import json
import os
import hashlib
import sqlite3

app = Flask(__name__)
CORS(app)  # Allow extension to connect

# Database setup
DB_PATH = 'truthstrike.db'

def init_db():
    """Initialize the database with pattern tables"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Patterns table
    c.execute('''CREATE TABLE IF NOT EXISTS patterns
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  category TEXT NOT NULL,
                  pattern TEXT NOT NULL,
                  severity TEXT NOT NULL,
                  funders TEXT,
                  counter_points TEXT,
                  created_at TIMESTAMP,
                  updated_at TIMESTAMP,
                  active BOOLEAN DEFAULT 1,
                  false_positive_count INTEGER DEFAULT 0,
                  true_positive_count INTEGER DEFAULT 0)''')

    # Reports table
    c.execute('''CREATE TABLE IF NOT EXISTS reports
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  url TEXT NOT NULL,
                  content TEXT,
                  platform TEXT,
                  pattern_matched TEXT,
                  user_feedback TEXT,
                  timestamp TIMESTAMP)''')

    # Money trails table
    c.execute('''CREATE TABLE IF NOT EXISTS money_trails
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  organization TEXT NOT NULL UNIQUE,
                  budget TEXT,
                  donors TEXT,
                  dark_money_percent REAL,
                  outputs TEXT,
                  harm_metrics TEXT,
                  updated_at TIMESTAMP)''')

    conn.commit()
    conn.close()

@app.route('/api/patterns', methods=['GET'])
def get_patterns():
    """Get all active patterns for the extension"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute('''SELECT category, pattern, severity, funders, counter_points
                 FROM patterns
                 WHERE active = 1
                 ORDER BY true_positive_count DESC''')

    patterns = {}
    for row in c.fetchall():
        category = row['category']
        if category not in patterns:
            patterns[category] = {
                'patterns': [],
                'severity': row['severity'],
                'category': category,
                'funders': json.loads(row['funders']) if row['funders'] else [],
                'counterPoints': json.loads(row['counter_points']) if row['counter_points'] else []
            }
        patterns[category]['patterns'].append(row['pattern'])

    conn.close()

    # Add version hash so extension knows when to update
    patterns_json = json.dumps(patterns, sort_keys=True)
    version_hash = hashlib.md5(patterns_json.encode()).hexdigest()

    return jsonify({
        'patterns': patterns,
        'version': version_hash,
        'updated': datetime.now().isoformat()
    })

@app.route('/api/patterns', methods=['POST'])
def add_pattern():
    """Add a new detection pattern (requires auth in production)"""
    data = request.json

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute('''INSERT INTO patterns
                 (category, pattern, severity, funders, counter_points, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)''',
              (data['category'],
               data['pattern'],
               data['severity'],
               json.dumps(data.get('funders', [])),
               json.dumps(data.get('counterPoints', [])),
               datetime.now(),
               datetime.now()))

    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Pattern added'})

@app.route('/api/report', methods=['POST'])
def report_content():
    """Receive reports from extension users"""
    data = request.json

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute('''INSERT INTO reports
                 (url, content, platform, pattern_matched, user_feedback, timestamp)
                 VALUES (?, ?, ?, ?, ?, ?)''',
              (data['url'],
               data.get('content', ''),
               data.get('platform', ''),
               data.get('pattern_matched', ''),
               data.get('feedback', ''),
               datetime.now()))

    # Update pattern statistics if provided
    if data.get('pattern_matched') and data.get('feedback'):
        if data['feedback'] == 'false_positive':
            c.execute('''UPDATE patterns
                        SET false_positive_count = false_positive_count + 1
                        WHERE pattern = ?''', (data['pattern_matched'],))
        elif data['feedback'] == 'true_positive':
            c.execute('''UPDATE patterns
                        SET true_positive_count = true_positive_count + 1
                        WHERE pattern = ?''', (data['pattern_matched'],))

    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Report received'})

@app.route('/api/money_trails', methods=['GET'])
def get_money_trails():
    """Get all money trail data"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute('SELECT * FROM money_trails')
    trails = []
    for row in c.fetchall():
        trails.append({
            'organization': row['organization'],
            'budget': row['budget'],
            'donors': json.loads(row['donors']) if row['donors'] else [],
            'darkMoneyPercent': row['dark_money_percent'],
            'outputs': json.loads(row['outputs']) if row['outputs'] else [],
            'harmMetrics': json.loads(row['harm_metrics']) if row['harm_metrics'] else {}
        })

    conn.close()
    return jsonify(trails)

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get statistics for dashboard"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    stats = {}

    # Total patterns
    c.execute('SELECT COUNT(*) FROM patterns WHERE active = 1')
    stats['total_patterns'] = c.fetchone()[0]

    # Total reports
    c.execute('SELECT COUNT(*) FROM reports')
    stats['total_reports'] = c.fetchone()[0]

    # Reports by platform
    c.execute('''SELECT platform, COUNT(*) as count
                 FROM reports
                 GROUP BY platform
                 ORDER BY count DESC''')
    stats['by_platform'] = dict(c.fetchall())

    # Top patterns by true positives
    c.execute('''SELECT category, pattern, true_positive_count
                 FROM patterns
                 WHERE true_positive_count > 0
                 ORDER BY true_positive_count DESC
                 LIMIT 10''')
    stats['top_patterns'] = [dict(row) for row in c.fetchall()]

    # Recent reports
    c.execute('''SELECT url, platform, timestamp
                 FROM reports
                 ORDER BY timestamp DESC
                 LIMIT 20''')
    stats['recent_reports'] = [dict(row) for row in c.fetchall()]

    conn.close()
    return jsonify(stats)

@app.route('/api/contribute', methods=['GET'])
def contribute_info():
    """Information on how to contribute patterns"""
    return jsonify({
        'instructions': {
            'step1': 'Identify a disinformation narrative with evidence',
            'step2': 'Research who funds/benefits from this narrative',
            'step3': 'Compile fact-based counter-points with sources',
            'step4': 'Submit via POST /api/patterns or GitHub PR'
        },
        'example': {
            'category': 'climate_denial_new',
            'pattern': 'carbon\\s+capture\\s+will\\s+save\\s+us',
            'severity': 'high',
            'funders': ['ExxonMobil', 'Shell', 'BP'],
            'counterPoints': [
                'Carbon capture is 1000x more expensive than renewables',
                'Used to justify continued fossil fuel extraction',
                'No commercial scale success after 50 years of trying'
            ]
        },
        'guidelines': {
            'patterns': 'Use regex format, case-insensitive',
            'severity': 'critical (immediate harm), high (widespread), medium (emerging)',
            'funders': 'Include sources for funding claims',
            'counterPoints': 'Keep under 280 chars for Twitter'
        }
    })

@app.route('/')
def home():
    """Basic info page"""
    return '''
    <html>
    <head>
        <title>TruthStrike Pattern Server</title>
        <style>
            body {
                font-family: monospace;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            h1 { color: #764ba2; }
            .endpoint {
                background: #f8f9fa;
                padding: 10px;
                margin: 10px 0;
                border-radius: 8px;
                border-left: 4px solid #764ba2;
            }
            .method {
                font-weight: bold;
                color: #667eea;
            }
            code {
                background: #f8f9fa;
                padding: 2px 6px;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>⚔️ TruthStrike Pattern Server</h1>
            <p>Local API for updating disinformation detection patterns</p>

            <h2>Endpoints:</h2>

            <div class="endpoint">
                <span class="method">GET</span> <code>/api/patterns</code>
                <br>Get all active detection patterns
            </div>

            <div class="endpoint">
                <span class="method">POST</span> <code>/api/patterns</code>
                <br>Add new detection pattern
            </div>

            <div class="endpoint">
                <span class="method">POST</span> <code>/api/report</code>
                <br>Report detected disinformation
            </div>

            <div class="endpoint">
                <span class="method">GET</span> <code>/api/money_trails</code>
                <br>Get money trail database
            </div>

            <div class="endpoint">
                <span class="method">GET</span> <code>/api/stats</code>
                <br>Get detection statistics
            </div>

            <div class="endpoint">
                <span class="method">GET</span> <code>/api/contribute</code>
                <br>How to contribute patterns
            </div>

            <h2>Status:</h2>
            <p>Server running on port 5000</p>
            <p>CORS enabled for browser extension</p>

            <h2>Testing:</h2>
            <pre>curl http://localhost:5000/api/patterns</pre>

            <p><em>Part of the Coalition's Counter-Infrastructure</em></p>
        </div>
    </body>
    </html>
    '''

def load_initial_patterns():
    """Load the initial pattern set from the extension"""
    initial_patterns = [
        {
            'category': 'election_fraud',
            'patterns': [
                'stolen\\s+election',
                'dominion\\s+voting',
                'stop\\s+the\\s+steal',
                'rigged\\s+election',
                'ballot\\s+harvesting',
                'dead\\s+people\\s+vot'
            ],
            'severity': 'high',
            'funders': ['Heritage Foundation', 'ALEC', 'True the Vote'],
            'counterPoints': [
                'No evidence of widespread fraud found in 60+ court cases',
                'Election security confirmed by Trump\'s own DHS',
                'Paper ballot audits confirmed electronic tallies'
            ]
        },
        {
            'category': 'climate_denial',
            'patterns': [
                'climate\\s+hoax',
                'global\\s+warming\\s+scam',
                'co2\\s+is\\s+plant\\s+food'
            ],
            'severity': 'high',
            'funders': ['Koch Industries', 'ExxonMobil', 'Heartland Institute'],
            'counterPoints': [
                '99.9% of climate scientists confirm human-caused warming',
                'Fossil fuel companies knew since 1970s',
                'Coal kills 100x more birds than wind turbines'
            ]
        }
    ]

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    for pattern_group in initial_patterns:
        for pattern in pattern_group['patterns']:
            try:
                c.execute('''INSERT INTO patterns
                            (category, pattern, severity, funders, counter_points, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?)''',
                         (pattern_group['category'],
                          pattern,
                          pattern_group['severity'],
                          json.dumps(pattern_group['funders']),
                          json.dumps(pattern_group['counterPoints']),
                          datetime.now(),
                          datetime.now()))
            except sqlite3.IntegrityError:
                pass  # Pattern already exists

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    load_initial_patterns()
    print("\n⚔️  TruthStrike Pattern Server")
    print("=" * 40)
    print("Running on: http://localhost:5000")
    print("API Docs: http://localhost:5000")
    print("\nEndpoints:")
    print("  GET  /api/patterns - Get detection patterns")
    print("  POST /api/report - Report disinformation")
    print("  GET  /api/stats - View statistics")
    print("\nPress Ctrl+C to stop")
    print("=" * 40)
    app.run(debug=True, port=5000)