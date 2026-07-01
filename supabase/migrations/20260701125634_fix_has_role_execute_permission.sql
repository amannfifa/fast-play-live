-- Bug fix: a prior migration revoked EXECUTE on public.has_role() from the
-- `authenticated` role. Every admin-gated RLS policy (on user_roles, sports,
-- matches, match_redirects) calls has_role(auth.uid(), 'admin') internally.
-- Without EXECUTE privilege, Postgres cannot invoke the function while
-- evaluating those policies, so every such query fails with
-- "permission denied for function has_role" -- even for users who do have
-- the admin role. This silently broke all admin access.
--
-- Fix: restore EXECUTE to `authenticated` only (keep it revoked from PUBLIC
-- and anon, so anonymous/unauthenticated callers still cannot probe roles
-- by calling the RPC directly).

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
