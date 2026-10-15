import { feed } from '../../lib/posts.mjs';

export async function GET() {
	return new Response(await feed('news', 'Decisio news', 'Releases, results and announcements from the Decisio project.'), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
