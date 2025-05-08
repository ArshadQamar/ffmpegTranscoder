import psutil

interfaces = psutil.net_if_addrs()

data = []
print(interfaces.items(1))

for name, addrs in interfaces.items():
    ips = []
    for addr in addrs:
        if addr.family.name == 'AF_INET':  # Only IPv4
            ips.append(addr.address)
    data.append({
        "name": name,
        "ip_addresses": ips
    })
#print(data)
