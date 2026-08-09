import type { ArchitectureNode, ResourceType } from '../../types';

const safe=(v:string)=>v.toLowerCase().replace(/[^a-z0-9_]+/g,'_').replace(/^_+|_+$/g,'')||'resource';
const q=(v:unknown)=>typeof v==='number'||typeof v==='boolean'?String(v):JSON.stringify(String(v??''));
const list=(v:unknown)=>String(v??'').split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean);
const tags=(n:ArchitectureNode)=>[
  '  tags = {',
  `    Name = ${q(n.data.label)}`,
  ...Object.entries(n.data.tags||{}).filter(([k])=>k!=='Name').map(([k,v])=>`    ${q(k)} = ${q(v)}`),
  '  }'
].join('\n');

const address=(n:ArchitectureNode)=>`${awsTerraformType(n.data.resourceType)}.${safe(n.data.label)}`;
const ref=(n:ArchitectureNode,attr='id')=>`${address(n)}.${attr}`;
const parent=(n:ArchitectureNode,nodes:ArchitectureNode[],type:ResourceType)=>{
 let cur=n.parentId?nodes.find(x=>x.id===n.parentId):undefined;
 while(cur){if(cur.data.resourceType===type)return cur;cur=cur.parentId?nodes.find(x=>x.id===cur!.parentId):undefined;}
 return undefined;
};
const byLabel=(nodes:ArchitectureNode[],type:ResourceType,label?:string)=>nodes.find(x=>x.data.resourceType===type&&x.data.label===label);

export const AWS_TERRAFORM_TYPES:Partial<Record<ResourceType,string>>={
 awsVpc:'aws_vpc',awsSubnet:'aws_subnet',awsEc2:'aws_instance',awsEc2AutoScaling:'aws_autoscaling_group',
 awsLambda:'aws_lambda_function',awsElasticBeanstalk:'aws_elastic_beanstalk_environment',
 awsEcs:'aws_ecs_cluster',awsEks:'aws_eks_cluster',awsEcr:'aws_ecr_repository',awsFargate:'aws_ecs_task_definition',
 awsS3:'aws_s3_bucket',awsEbs:'aws_ebs_volume',awsBackup:'aws_backup_plan',
 awsRds:'aws_db_instance',awsAurora:'aws_rds_cluster',awsDynamoDb:'aws_dynamodb_table',
 awsKms:'aws_kms_key',awsSecretsManager:'aws_secretsmanager_secret',awsSecurityHub:'aws_securityhub_account',
 awsNetworkFirewall:'aws_networkfirewall_firewall',awsTransitGateway:'aws_ec2_transit_gateway',
 awsDirectConnect:'aws_dx_connection',awsSiteToSiteVpn:'aws_vpn_connection',awsCloudFront:'aws_cloudfront_distribution',
 awsRoute53:'aws_route53_zone',awsAlb:'aws_lb',awsNlb:'aws_lb',awsPrivateLink:'aws_vpc_endpoint',
 awsApiGateway:'aws_apigatewayv2_api',awsCloudFormation:'aws_cloudformation_stack',
 awsCloudWatch:'aws_cloudwatch_log_group',awsCloudTrail:'aws_cloudtrail',
 awsSqs:'aws_sqs_queue',awsSns:'aws_sns_topic',awsEventBridge:'aws_cloudwatch_event_rule',
 awsStepFunctions:'aws_sfn_state_machine'
};

export const awsTerraformType=(type:ResourceType)=>AWS_TERRAFORM_TYPES[type]||`aws_${String(type).replace(/^aws/,'').toLowerCase()}`;

const subnetRef=(n:ArchitectureNode,nodes:ArchitectureNode[])=>{
 const subnet=byLabel(nodes,'awsSubnet',n.data.awsSubnet)||parent(n,nodes,'awsSubnet');
 return subnet?ref(subnet):'var.aws_subnet_id';
};
const vpcRef=(n:ArchitectureNode,nodes:ArchitectureNode[])=>{
 const vpc=byLabel(nodes,'awsVpc',n.data.awsVpc)||parent(n,nodes,'awsVpc');
 return vpc?ref(vpc):'var.aws_vpc_id';
};
const subnetIds=(n:ArchitectureNode,nodes:ArchitectureNode[])=>{
 const explicit=list(n.data.properties?.subnetIds);
 if(explicit.length)return `[${explicit.map(q).join(', ')}]`;
 const nested=nodes.filter(x=>x.data.cloudProvider==='aws'&&x.data.resourceType==='awsSubnet'&&(x.parentId===n.id||x.data.awsVpc===n.data.label));
 if(nested.length)return `[${nested.map(x=>ref(x)).join(', ')}]`;
 const anc=parent(n,nodes,'awsSubnet');
 return anc?`[${ref(anc)}]`:'var.aws_subnet_ids';
};
const sgIds=(p:Record<string,unknown>)=>{
 const vals=list(p.securityGroupIds);
 return vals.length?`[${vals.map(q).join(', ')}]`:'var.aws_security_group_ids';
};

export const generateAwsTerraformForNode=(n:ArchitectureNode,nodes:ArchitectureNode[]):string=>{
 const t=n.data.resourceType;
 const name=safe(n.data.label);
 const p=(n.data.properties||{}) as Record<string,any>;

 if(t==='awsAccount')return `# AWS Account boundary: ${n.data.label}\n# Organizational canvas container only; no Terraform resource is created for a standard AWS account.`;

 if(t==='awsVpc')return [
  `resource "aws_vpc" "${name}" {`,
  `  cidr_block           = ${q(p.cidrBlock||'10.0.0.0/16')}`,
  `  enable_dns_support   = ${q(p.enableDnsSupport??true)}`,
  `  enable_dns_hostnames = ${q(p.enableDnsHostnames??true)}`,
  `  instance_tenancy     = ${q(p.instanceTenancy||'default')}`,
  p.ipv6Enabled?`  assign_generated_ipv6_cidr_block = true`:'',
  tags(n),'}'
 ].filter(Boolean).join('\n');

 if(t==='awsSubnet')return [
  `resource "aws_subnet" "${name}" {`,
  `  vpc_id                  = ${vpcRef(n,nodes)}`,
  `  cidr_block              = ${q(p.cidrBlock||'10.0.1.0/24')}`,
  `  availability_zone       = ${q(p.availabilityZone||`${n.data.region||'ap-south-1'}a`)}`,
  `  map_public_ip_on_launch = ${q(p.mapPublicIpOnLaunch??false)}`,
  tags(n),'}'
 ].join('\n');

 if(t==='awsEc2'){
  const body=[`resource "aws_instance" "${name}" {`,
   `  ami                         = ${q(p.amiId||'ami-REPLACE_ME')}`,
   `  instance_type               = ${q(p.instanceType||'t3.micro')}`,
   `  subnet_id                   = ${subnetRef(n,nodes)}`,
   `  associate_public_ip_address = ${q(p.associatePublicIp??false)}`];
  if(p.keyName)body.push(`  key_name                    = ${q(p.keyName)}`);
  const sgs=list(p.securityGroupIds);if(sgs.length)body.push(`  vpc_security_group_ids      = [${sgs.map(q).join(', ')}]`);
  if(p.iamInstanceProfile)body.push(`  iam_instance_profile        = ${q(p.iamInstanceProfile)}`);
  if(p.userData)body.push(`  user_data                   = ${q(p.userData)}`);
  body.push('',`  ebs_optimized = ${q(p.ebsOptimized??true)}`,'','  root_block_device {',`    volume_size = ${q(p.rootVolumeSize??30)}`,`    volume_type = ${q(p.rootVolumeType||'gp3')}`,'  }','',tags(n),'}');
  return body.join('\n');
 }

 if(t==='awsEc2AutoScaling')return [
  `resource "aws_launch_template" "${name}_lt" {`,`  name_prefix   = ${q(`${n.data.label}-`)}`,`  image_id      = "ami-REPLACE_ME"`,`  instance_type = "t3.micro"`,'}',
  '',
  `resource "aws_autoscaling_group" "${name}" {`,`  name                = ${q(n.data.label)}`,`  min_size            = ${q(p.minSize??1)}`,`  desired_capacity    = ${q(p.desiredCapacity??2)}`,`  max_size            = ${q(p.maxSize??4)}`,`  vpc_zone_identifier = ${subnetIds(n,nodes)}`,'  launch_template {',`    id      = aws_launch_template.${name}_lt.id`,'    version = "$Latest"','  }','}'
 ].join('\n');

 if(t==='awsLambda')return [
  `resource "aws_lambda_function" "${name}" {`,`  function_name = ${q(n.data.label)}`,`  role          = ${q(p.roleArn||'arn:aws:iam::REPLACE_ME:role/REPLACE_ME')}`,`  runtime       = ${q(p.runtime||'python3.12')}`,`  handler       = ${q(p.handler||'lambda_function.lambda_handler')}`,`  filename      = "lambda.zip"`,`  source_code_hash = filebase64sha256("lambda.zip")`,`  memory_size   = ${q(p.memorySize??512)}`,`  timeout       = ${q(p.timeout??30)}`,
  p.environmentVariables?`  # Environment variables: ${String(p.environmentVariables).replace(/\n/g,'; ')}`:'',
  list(p.subnetIds).length||list(p.securityGroupIds).length?['  vpc_config {',`    subnet_ids         = ${list(p.subnetIds).length?`[${list(p.subnetIds).map(q).join(', ')}]`:'var.aws_subnet_ids'}`,`    security_group_ids = ${sgIds(p)}`,'  }'].join('\n'):'',
  tags(n),'}'
 ].filter(Boolean).join('\n');

 if(t==='awsElasticBeanstalk')return [
  `resource "aws_elastic_beanstalk_application" "${name}_app" {`,`  name = ${q(p.applicationName||n.data.label)}`,'}',
  '',`resource "aws_elastic_beanstalk_environment" "${name}" {`,`  name                = ${q(p.environmentName||`${n.data.label}-env`)}`,`  application         = aws_elastic_beanstalk_application.${name}_app.name`,`  solution_stack_name = ${q(p.platformArn||'64bit Amazon Linux 2023 v4.0.0 running Docker')}`,'}'
 ].join('\n');

 if(t==='awsEcs')return [`resource "aws_ecs_cluster" "${name}" {`,`  name = ${q(p.clusterName||n.data.label)}`,'  setting {','    name  = "containerInsights"',`    value = ${q(p.containerInsights===false?'disabled':'enabled')}`,'  }',tags(n),'}'].join('\n');

 if(t==='awsEks')return [
  `resource "aws_iam_role" "${name}_role" {`,`  name = ${q(`${n.data.label}-cluster-role`)}`,'  assume_role_policy = jsonencode({ Version="2012-10-17", Statement=[{Effect="Allow",Principal={Service="eks.amazonaws.com"},Action="sts:AssumeRole"}] })','}',
  '',`resource "aws_eks_cluster" "${name}" {`,`  name     = ${q(n.data.label)}`,`  role_arn = aws_iam_role.${name}_role.arn`,`  version  = ${q(p.kubernetesVersion||'1.31')}`,'  vpc_config {',`    subnet_ids              = ${subnetIds(n,nodes)}`,`    security_group_ids      = ${sgIds(p)}`,`    endpoint_private_access = ${q(p.privateEndpoint??true)}`,`    endpoint_public_access  = ${q(p.publicEndpoint??false)}`,'  }',tags(n),'}'
 ].join('\n');

 if(t==='awsEcr')return [`resource "aws_ecr_repository" "${name}" {`,`  name                 = ${q(p.repositoryName||n.data.label)}`,`  image_tag_mutability = ${q(p.imageTagMutability||'IMMUTABLE')}`,'  image_scanning_configuration {',`    scan_on_push = ${q(p.scanOnPush??true)}`,'  }','  encryption_configuration {',`    encryption_type = ${q(p.encryptionType||'AES256')}`,'  }',tags(n),'}'].join('\n');

 if(t==='awsFargate')return [
  `resource "aws_ecs_task_definition" "${name}" {`,`  family                   = ${q(n.data.label)}`,`  requires_compatibilities = ["FARGATE"]`,`  network_mode             = "awsvpc"`,`  cpu                      = ${q(String(p.cpu||'512'))}`,`  memory                   = ${q(String(p.memory||'1024'))}`,`  execution_role_arn       = "arn:aws:iam::REPLACE_ME:role/ecsTaskExecutionRole"`,`  container_definitions = jsonencode([{ name=${q(name)}, image="REPLACE_ME.dkr.ecr.REGION.amazonaws.com/image:latest", essential=true, portMappings=[] }])`,tags(n),'}'
 ].join('\n');

 if(t==='awsS3')return [
  `resource "aws_s3_bucket" "${name}" {`,`  bucket = ${q(p.bucketName||safe(n.data.label).replace(/_/g,'-'))}`,tags(n),'}',
  p.versioning!==false?`\nresource "aws_s3_bucket_versioning" "${name}" {\n  bucket = aws_s3_bucket.${name}.id\n  versioning_configuration { status = "Enabled" }\n}`:'',
  p.blockPublicAccess!==false?`\nresource "aws_s3_bucket_public_access_block" "${name}" {\n  bucket = aws_s3_bucket.${name}.id\n  block_public_acls=true\n  block_public_policy=true\n  ignore_public_acls=true\n  restrict_public_buckets=true\n}`:''
 ].filter(Boolean).join('\n');

 if(t==='awsEbs')return [`resource "aws_ebs_volume" "${name}" {`,`  availability_zone = ${q(p.availabilityZone||`${n.data.region||'ap-south-1'}a`)}`,`  size              = ${q(p.sizeGiB??100)}`,`  type              = ${q(p.volumeType||'gp3')}`,`  encrypted         = ${q(p.encrypted??true)}`,p.iops?`  iops              = ${q(p.iops)}`:'',p.throughput?`  throughput        = ${q(p.throughput)}`:'',tags(n),'}'].filter(Boolean).join('\n');

 if(t==='awsBackup')return [
  `resource "aws_backup_vault" "${name}_vault" {`,`  name = ${q(p.vaultName||`${n.data.label}-vault`)}`,'}',
  '',`resource "aws_backup_plan" "${name}" {`,`  name = ${q(p.planName||n.data.label)}`,'  rule {',`    rule_name         = ${q(`${n.data.label}-rule`)}`,`    target_vault_name = aws_backup_vault.${name}_vault.name`,`    schedule          = ${q(p.schedule||'cron(0 5 ? * * *)')}`,'    lifecycle {',`      delete_after = ${q(p.retentionDays??35)}`,'    }','  }','}'
 ].join('\n');

 if(t==='awsRds')return [
  `resource "aws_db_subnet_group" "${name}_subnets" {`,`  name       = ${q(`${n.data.label}-subnets`)}`,`  subnet_ids = ${subnetIds(n,nodes)}`,tags(n),'}',
  '',`resource "aws_db_instance" "${name}" {`,`  identifier              = ${q(safe(n.data.label).replace(/_/g,'-'))}`,`  engine                  = ${q(p.engine||'postgres')}`,p.engineVersion?`  engine_version          = ${q(p.engineVersion)}`:'',`  instance_class          = ${q(p.instanceClass||'db.t4g.micro')}`,`  allocated_storage       = ${q(p.allocatedStorage??100)}`,`  storage_type            = ${q(p.storageType||'gp3')}`,`  multi_az                = ${q(p.multiAz??true)}`,`  storage_encrypted       = ${q(p.storageEncrypted??true)}`,`  db_subnet_group_name    = aws_db_subnet_group.${name}_subnets.name`,`  vpc_security_group_ids  = ${sgIds(p)}`,`  publicly_accessible     = ${q(p.publiclyAccessible??false)}`,`  backup_retention_period = ${q(p.backupRetentionPeriod??7)}`,'  username                 = "dbadmin"','  password                 = var.aws_db_password','  skip_final_snapshot      = true',tags(n),'}'
 ].filter(Boolean).join('\n');

 if(t==='awsAurora')return [
  `resource "aws_db_subnet_group" "${name}_subnets" {`,`  name       = ${q(`${n.data.label}-subnets`)}`,`  subnet_ids = ${subnetIds(n,nodes)}`,tags(n),'}',
  '',`resource "aws_rds_cluster" "${name}" {`,`  cluster_identifier      = ${q(safe(n.data.label).replace(/_/g,'-'))}`,`  engine                  = ${q(p.engine||'aurora-postgresql')}`,p.engineVersion?`  engine_version          = ${q(p.engineVersion)}`:'',`  db_subnet_group_name    = aws_db_subnet_group.${name}_subnets.name`,`  vpc_security_group_ids  = ${sgIds(p)}`,`  storage_encrypted       = ${q(p.storageEncrypted??true)}`,`  backup_retention_period = ${q(p.backupRetentionPeriod??7)}`,`  master_username         = "dbadmin"`,`  master_password         = var.aws_db_password`,`  skip_final_snapshot     = true`,tags(n),'}',
  '',...Array.from({length:Number(p.instances??2)},(_,i)=>[`resource "aws_rds_cluster_instance" "${name}_${i+1}" {`,`  identifier         = ${q(`${safe(n.data.label).replace(/_/g,'-')}-${i+1}`)}`,`  cluster_identifier = aws_rds_cluster.${name}.id`,`  instance_class     = ${q(p.instanceClass||'db.r6g.large')}`,`  engine             = aws_rds_cluster.${name}.engine`,'}'].join('\n'))
 ].filter(Boolean).join('\n');

 if(t==='awsDynamoDb')return [`resource "aws_dynamodb_table" "${name}" {`,`  name         = ${q(p.tableName||n.data.label)}`,`  billing_mode = ${q(p.billingMode||'PAY_PER_REQUEST')}`,`  hash_key     = ${q(p.partitionKey||'id')}`,p.sortKey?`  range_key    = ${q(p.sortKey)}`:'','  attribute {',`    name = ${q(p.partitionKey||'id')}`,'    type = "S"','  }',p.sortKey?['  attribute {',`    name = ${q(p.sortKey)}`,'    type = "S"','  }'].join('\n'):'',p.pointInTimeRecovery!==false?'  point_in_time_recovery { enabled = true }':'',tags(n),'}'].filter(Boolean).join('\n');

 if(t==='awsKms')return [`resource "aws_kms_key" "${name}" {`,`  description             = ${q(n.data.description||n.data.label)}`,`  deletion_window_in_days = ${q(p.deletionWindowDays??30)}`,`  enable_key_rotation     = ${q(p.enableKeyRotation??true)}`,`  key_usage               = ${q(p.keyUsage||'ENCRYPT_DECRYPT')}`,`  customer_master_key_spec = ${q(p.keySpec||'SYMMETRIC_DEFAULT')}`,tags(n),'}',p.alias?`\nresource "aws_kms_alias" "${name}" {\n  name = ${q(p.alias)}\n  target_key_id = aws_kms_key.${name}.key_id\n}`:''].filter(Boolean).join('\n');

 if(t==='awsSecretsManager')return [`resource "aws_secretsmanager_secret" "${name}" {`,`  name                    = ${q(p.secretName||n.data.label)}`,p.kmsKeyId?`  kms_key_id              = ${q(p.kmsKeyId)}`:'',`  recovery_window_in_days = ${q(p.recoveryWindowDays??30)}`,tags(n),'}'].filter(Boolean).join('\n');

 if(t==='awsSecurityHub')return [`resource "aws_securityhub_account" "${name}" {`,`  enable_default_standards = ${q(p.enableDefaultStandards??true)}`,'}'].join('\n');

 if(t==='awsNetworkFirewall')return [
  `resource "aws_networkfirewall_firewall_policy" "${name}_policy" {`,`  name = ${q(`${n.data.label}-policy`)}`,'  firewall_policy {','    stateless_default_actions          = ["aws:forward_to_sfe"]','    stateless_fragment_default_actions = ["aws:forward_to_sfe"]','  }','}',
  '',`resource "aws_networkfirewall_firewall" "${name}" {`,`  name                = ${q(n.data.label)}`,`  firewall_policy_arn = ${p.firewallPolicyArn?q(p.firewallPolicyArn):`aws_networkfirewall_firewall_policy.${name}_policy.arn`}`,`  vpc_id              = ${vpcRef(n,nodes)}`,`  delete_protection   = ${q(p.deleteProtection??true)}`,...(list(p.subnetIds).length?list(p.subnetIds).map(id=>`  subnet_mapping { subnet_id = ${q(id)} }`):[`  subnet_mapping { subnet_id = ${subnetRef(n,nodes)} }`]),tags(n),'}'
 ].join('\n');

 if(t==='awsTransitGateway')return [`resource "aws_ec2_transit_gateway" "${name}" {`,`  description                     = ${q(n.data.description||n.data.label)}`,`  amazon_side_asn                 = ${q(p.amazonSideAsn??64512)}`,`  dns_support                     = ${q((p.dnsSupport??true)?'enable':'disable')}`,`  vpn_ecmp_support                = ${q((p.vpnEcmpSupport??true)?'enable':'disable')}`,`  auto_accept_shared_attachments  = ${q((p.autoAcceptSharedAttachments??false)?'enable':'disable')}`,tags(n),'}'].join('\n');

 if(t==='awsDirectConnect')return [`resource "aws_dx_connection" "${name}" {`,`  name      = ${q(n.data.label)}`,`  bandwidth = ${q(p.bandwidth||'1Gbps')}`,`  location  = ${q(p.locationCode||'REPLACE_ME_DX_LOCATION')}`,tags(n),'}'].join('\n');

 if(t==='awsSiteToSiteVpn')return [
  `resource "aws_customer_gateway" "${name}_cgw" {`,`  bgp_asn    = ${q(p.customerGatewayAsn??65000)}`,`  ip_address = ${q(p.customerGatewayIp||'REPLACE_ME_PUBLIC_IP')}`,'  type       = "ipsec.1"',tags(n),'}',
  '',`resource "aws_vpn_gateway" "${name}_vgw" {`,`  vpc_id = ${vpcRef(n,nodes)}`,tags(n),'}',
  '',`resource "aws_vpn_connection" "${name}" {`,`  customer_gateway_id = aws_customer_gateway.${name}_cgw.id`,`  vpn_gateway_id      = aws_vpn_gateway.${name}_vgw.id`,'  type                = "ipsec.1"',`  static_routes_only  = ${q(p.staticRoutesOnly??false)}`,tags(n),'}'
 ].join('\n');

 if(t==='awsCloudFront')return [
  `resource "aws_cloudfront_distribution" "${name}" {`,`  enabled             = true`,`  is_ipv6_enabled     = ${q(p.ipv6Enabled??true)}`,p.defaultRootObject?`  default_root_object = ${q(p.defaultRootObject)}`:'',
  '  origin {',`    domain_name = ${q(p.originDomain||'REPLACE_ME_ORIGIN')}`,`    origin_id   = ${q(`${name}-origin`)}`,'    custom_origin_config { http_port=80 https_port=443 origin_protocol_policy="https-only" origin_ssl_protocols=["TLSv1.2"] }','  }',
  '  default_cache_behavior {',`    target_origin_id       = ${q(`${name}-origin`)}`,`    viewer_protocol_policy = ${q(p.viewerProtocolPolicy||'redirect-to-https')}`,'    allowed_methods        = ["GET","HEAD","OPTIONS"]','    cached_methods         = ["GET","HEAD"]','    forwarded_values { query_string=false cookies { forward="none" } }','  }',
  `  price_class = ${q(p.priceClass||'PriceClass_100')}`,'  restrictions { geo_restriction { restriction_type="none" } }','  viewer_certificate { cloudfront_default_certificate = true }',tags(n),'}'
 ].filter(Boolean).join('\n');

 if(t==='awsRoute53'){
  const z=[`resource "aws_route53_zone" "${name}" {`,`  name = ${q(p.hostedZoneName||n.data.label)}`];
  if(p.zoneType==='Private')z.push('  vpc {',`    vpc_id = ${vpcRef(n,nodes)}`,'  }');
  z.push(tags(n),'}');
  if(p.recordName)z.push('',`resource "aws_route53_record" "${name}_record" {`,`  zone_id = aws_route53_zone.${name}.zone_id`,`  name    = ${q(p.recordName)}`,`  type    = ${q(p.recordType||'A')}`,`  ttl     = ${q(p.ttl??300)}`,`  records = [${list(p.recordValues).map(q).join(', ')||q('REPLACE_ME')}]`,'}');
  return z.join('\n');
 }

 if(t==='awsAlb'||t==='awsNlb'){
  const isAlb=t==='awsAlb';return [
   `resource "aws_lb" "${name}" {`,`  name               = ${q(safe(n.data.label).replace(/_/g,'-').slice(0,32))}`,`  internal           = ${q((p.scheme|| (isAlb?'internet-facing':'internal'))==='internal')}`,`  load_balancer_type = ${q(isAlb?'application':'network')}`,isAlb?`  security_groups    = ${sgIds(p)}`:'',`  subnets            = ${subnetIds(n,nodes)}`,`  enable_deletion_protection = ${q(p.deletionProtection??true)}`,tags(n),'}',
   '',`resource "aws_lb_target_group" "${name}_tg" {`,`  name     = ${q(`${safe(n.data.label).replace(/_/g,'-').slice(0,24)}-tg`)}`,`  port     = ${q(Number(p.listenerPort||443))}`,`  protocol = ${q(isAlb?'HTTP':'TCP')}`,`  vpc_id   = ${vpcRef(n,nodes)}`,'}',
   '',`resource "aws_lb_listener" "${name}" {`,`  load_balancer_arn = aws_lb.${name}.arn`,`  port              = ${q(Number(p.listenerPort||443))}`,`  protocol          = ${q(p.listenerProtocol|| (isAlb?'HTTPS':'TCP'))}`,p.certificateArn?`  certificate_arn   = ${q(p.certificateArn)}`:'','  default_action {','    type             = "forward"',`    target_group_arn = aws_lb_target_group.${name}_tg.arn`,'  }','}'
  ].filter(Boolean).join('\n');
 }

 if(t==='awsPrivateLink')return [`resource "aws_vpc_endpoint" "${name}" {`,`  vpc_id            = ${vpcRef(n,nodes)}`,`  service_name      = ${q(p.serviceName||'com.amazonaws.REGION.REPLACE_ME')}`,`  vpc_endpoint_type = ${q(p.endpointType||'Interface')}`,p.endpointType==='Gateway'?'':`  subnet_ids         = ${subnetIds(n,nodes)}`,p.endpointType==='Gateway'?'':`  security_group_ids = ${sgIds(p)}`,`  private_dns_enabled = ${q(p.privateDnsEnabled??true)}`,tags(n),'}'].filter(Boolean).join('\n');

 if(t==='awsApiGateway')return [
  `resource "aws_apigatewayv2_api" "${name}" {`,`  name          = ${q(n.data.label)}`,`  protocol_type = ${q((p.apiType||'HTTP')==='WebSocket'?'WEBSOCKET':'HTTP')}`,tags(n),'}',
  '',`resource "aws_apigatewayv2_stage" "${name}" {`,`  api_id      = aws_apigatewayv2_api.${name}.id`,`  name        = ${q(p.stageName||'$default')}`,'  auto_deploy = true','}'
 ].join('\n');

 if(t==='awsCloudFormation')return [`resource "aws_cloudformation_stack" "${name}" {`,`  name = ${q(p.stackName||n.data.label)}`,p.templateLocation?`  template_url = ${q(p.templateLocation)}`:`  template_body = file("template.yaml")`,`  enable_termination_protection = ${q(p.terminationProtection??true)}`,tags(n),'}'].filter(Boolean).join('\n');

 if(t==='awsCloudWatch'){
  const b=[`resource "aws_cloudwatch_log_group" "${name}" {`,`  name              = ${q(p.logGroupName||`/archmind/${safe(n.data.label)}`)}`,`  retention_in_days = ${q(p.retentionDays??30)}`,tags(n),'}'];
  if(p.alarmName)b.push('',`resource "aws_cloudwatch_metric_alarm" "${name}_alarm" {`,`  alarm_name          = ${q(p.alarmName)}`,'  comparison_operator = "GreaterThanThreshold"','  evaluation_periods  = 1','  metric_name         = "CPUUtilization"',`  namespace           = ${q(p.metricNamespace||'AWS/EC2')}`,'  period              = 300','  statistic           = "Average"',`  threshold           = ${q(Number(p.alarmThreshold||80))}`,'}');
  return b.join('\n');
 }

 if(t==='awsCloudTrail')return [
  `resource "aws_s3_bucket" "${name}_logs" {`,`  bucket = ${q((p.s3BucketName||`${safe(n.data.label)}-cloudtrail-logs`).replace(/_/g,'-'))}`,'}',
  '',`resource "aws_cloudtrail" "${name}" {`,`  name                          = ${q(p.trailName||n.data.label)}`,`  s3_bucket_name                = aws_s3_bucket.${name}_logs.id`,`  include_global_service_events = ${q(p.includeGlobalEvents??true)}`,`  is_multi_region_trail         = ${q(p.multiRegionTrail??true)}`,`  enable_log_file_validation    = ${q(p.logFileValidation??true)}`,p.kmsKeyId?`  kms_key_id                    = ${q(p.kmsKeyId)}`:'',tags(n),'}'
 ].filter(Boolean).join('\n');

 if(t==='awsSqs')return [`resource "aws_sqs_queue" "${name}" {`,`  name                       = ${q(p.queueName||n.data.label)}`,`  fifo_queue                 = ${q(p.fifoQueue??false)}`,`  visibility_timeout_seconds = ${q(p.visibilityTimeout??30)}`,`  message_retention_seconds  = ${q(p.messageRetention??345600)}`,`  receive_wait_time_seconds  = ${q(p.receiveWaitTime??20)}`,`  sqs_managed_sse_enabled    = ${q(p.sseEnabled??true)}`,tags(n),'}'].join('\n');

 if(t==='awsSns')return [`resource "aws_sns_topic" "${name}" {`,`  name                        = ${q(p.topicName||n.data.label)}`,`  fifo_topic                  = ${q(p.fifoTopic??false)}`,p.kmsKeyId?`  kms_master_key_id           = ${q(p.kmsKeyId)}`:'',p.fifoTopic?`  content_based_deduplication = ${q(p.contentBasedDeduplication??false)}`:'',tags(n),'}'].filter(Boolean).join('\n');

 if(t==='awsEventBridge')return [`resource "aws_cloudwatch_event_rule" "${name}" {`,`  name = ${q(p.ruleName||n.data.label)}`,p.eventPattern?`  event_pattern = ${q(p.eventPattern)}`:'',p.scheduleExpression?`  schedule_expression = ${q(p.scheduleExpression)}`:'',tags(n),'}'].filter(Boolean).join('\n');

 if(t==='awsStepFunctions')return [
  `resource "aws_iam_role" "${name}_role" {`,`  name = ${q(`${n.data.label}-sfn-role`)}`,'  assume_role_policy = jsonencode({Version="2012-10-17",Statement=[{Effect="Allow",Principal={Service="states.amazonaws.com"},Action="sts:AssumeRole"}]})','}',
  '',`resource "aws_sfn_state_machine" "${name}" {`,`  name     = ${q(p.stateMachineName||n.data.label)}`,`  role_arn = ${p.roleArn?q(p.roleArn):`aws_iam_role.${name}_role.arn`}`,`  type     = ${q(p.stateMachineType||'STANDARD')}`,`  definition = ${p.definition?q(p.definition):'jsonencode({StartAt="Pass",States={Pass={Type="Pass",End=true}}})'}`,tags(n),'}'
 ].join('\n');

 return `# No AWS Terraform mapping found for ${t}: ${n.data.label}`;
};

export const generateAwsTerraform=(nodes:ArchitectureNode[])=>nodes
 .filter(n=>n.data.cloudProvider==='aws')
 .map(n=>generateAwsTerraformForNode(n,nodes))
 .filter(Boolean)
 .join('\n\n');

export const awsTerraformMapped=(type:ResourceType)=>type==='awsAccount'||Boolean(AWS_TERRAFORM_TYPES[type]);
