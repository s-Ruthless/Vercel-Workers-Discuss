import { ref, watch } from 'vue';

// Migrate old 'default' value to 'blog'
const stored = localStorage.getItem('vwd_admin_site_id');
if (stored === 'default') {
  localStorage.setItem('vwd_admin_site_id', 'blog');
}

const currentSiteId = ref(localStorage.getItem('vwd_admin_site_id') || 'blog');

watch(currentSiteId, (val) => {
  if (val) {
    localStorage.setItem('vwd_admin_site_id', val);
  } else {
    localStorage.removeItem('vwd_admin_site_id');
  }
});

export function useSite() {
  return { currentSiteId };
}
