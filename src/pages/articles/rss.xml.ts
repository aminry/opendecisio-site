import { feed } from '../../lib/posts.mjs';

export async function GET() {
	return new Response(await feed('articles', 'Decisio articles', 'Longer pieces on typed decisions, measured results and running Decisio.'), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
