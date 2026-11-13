import type { APIRoute } from 'astro';
import { recipeIds, routeScript, teachBody } from '../../../lib/use-cases.mjs';

export function getStaticPaths() {
    return recipeIds.flatMap((id: string) => [
        { params: { recipe: id }, props: { text: routeScript(id) } },
        { params: { recipe: `${id}-register` }, props: { text: teachBody(id) } },
    ]);
}

export const GET: APIRoute = ({ props }) => new Response(props.text + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
});
