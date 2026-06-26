import urllib.request
import re
import ssl

url = 'https://www.pexels.com/video/bustling-street-market-aerial-view-35245798/'
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
req = urllib.request.Request(url, headers=headers)
context = ssl._create_unverified_context()

try:
    print("Fetching page...")
    html = urllib.request.urlopen(req, context=context).read().decode('utf-8')
    # Look for the video URL in the page source
    match = re.search(r'https://video\.pexels\.com/video-files/[^\"\s\>]+', html)
    
    if match:
        video_url = match.group(0)
        print('Found video URL:', video_url)
        print('Downloading...')
        urllib.request.urlretrieve(video_url, 'pexels_street_market.mp4')
        print('Downloaded successfully!')
    else:
        print('Could not find video URL in HTML. Checking alternative regex...')
        match2 = re.search(r'\"(https://vimeo\.com/external/[^\"\s\>]+)\"', html)
        if match2:
            print('Found Vimeo URL:', match2.group(1))
        else:
            print('No video URL found.')
except Exception as e:
    print('Error:', e)
